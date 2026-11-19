import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/common/Button';

/**
 * 404 Not Found page.
 */
const NotFound: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
    <FileQuestion size={72} className="text-primary mb-6" />
    <h1 className="text-5xl font-bold text-primary-text mb-2">404</h1>
    <p className="text-lg text-secondary-text mb-8">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link to="/">
      <Button>Back to Home</Button>
    </Link>
  </div>
);

export default NotFound;
