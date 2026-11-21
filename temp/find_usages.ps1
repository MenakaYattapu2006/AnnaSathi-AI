$tables = @('users','user_sessions','email_otp_challenges','password_reset_requests','admin_activity_logs','ngos','ngo_documents','ngo_requirements','ngo_capacity','donations','donation_images','donation_status_history','volunteers','assignments','delivery_status_history','volunteer_location_updates','notifications','notification_preferences','chatbot_conversations')
foreach ($t in $tables) {
  Get-ChildItem -Path 'C:\Users\pavan\OneDrive\Desktop\Projects\AnnaSathi AI\backend\src' -Recurse -Include *.js | Select-String -Pattern $t -SimpleMatch | ForEach-Object { Write-Output "$t:`t$($_.Path)" }
}
