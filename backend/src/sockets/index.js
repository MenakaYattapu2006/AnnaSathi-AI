/**
 * Socket.IO Handler for Real-Time Notifications, Donation Updates, and Volunteer Telemetry
 */

let ioInstance = null;

export function initSockets(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client authentication and room joining
    socket.on('authenticate', (data) => {
      if (data?.userId) {
        socket.userId = data.userId;
        socket.join(`user:${data.userId}`);
        if (data.role) {
          socket.role = data.role;
          socket.join(`role:${data.role}`);
        }
      }
    });

    // Join tracking room for a specific donation
    socket.on('join:donation', (donationId) => {
      if (donationId) {
        socket.join(`donation:${donationId}`);
      }
    });

    // Leave tracking room
    socket.on('leave:donation', (donationId) => {
      if (donationId) {
        socket.leave(`donation:${donationId}`);
      }
    });

    // Volunteer real-time location stream
    socket.on('volunteer:location', (locationData) => {
      if (locationData && socket.userId) {
        // Broadcast to relevant parties (admin telemetry and donation room)
        io.to('role:admin').emit('telemetry:volunteer_location', {
          volunteerId: socket.userId,
          ...locationData,
          timestamp: new Date().toISOString()
        });

        if (locationData.donationId) {
          io.to(`donation:${locationData.donationId}`).emit('tracking:location_update', {
            volunteerId: socket.userId,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            heading: locationData.heading,
            speed: locationData.speed,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getIO() {
  return ioInstance;
}

export function emitToUser(userId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
}

export function emitToRole(role, event, payload) {
  if (ioInstance) {
    ioInstance.to(`role:${role}`).emit(event, payload);
  }
}

export function emitDonationUpdate(donationId, payload) {
  if (ioInstance) {
    ioInstance.to(`donation:${donationId}`).emit('donation:status_change', payload);
  }
}
