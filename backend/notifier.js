export function sendAlert(machine, alert) {
  const stoppedAtDate = new Date(machine.stopped_at);
  const timeStr = stoppedAtDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const diffMins = Math.floor((new Date() - stoppedAtDate) / 60000);

  const message = [
    '🚨 Eco365 Machine Alert',
    machine.name + ' has been stopped for ' + diffMins + ' minutes.',
    'Stopped since: ' + timeStr,
    'RPM: 0',
    'Please check the machine.'
  ].join('\n');

  console.log(message);

  // Twilio (SMS) stub
  // twilioClient.messages.create({ body: message, from: '+1234567890', to: '+0987654321' });

  // WhatsApp Business API stub
  // whatsappClient.sendMessage({ to: '+0987654321', body: message });

  // Nodemailer (Email) stub
  // transporter.sendMail({ from: 'alerts@eco365.com', to: 'maintenance@eco365.com', subject: 'Machine Alert', text: message });
}

export function sendResolution(machine, downtimeDuration) {
  const message = [
    '🟢 Eco365 Machine Update',
    machine.name + ' has resumed operation.',
    'Downtime: ' + downtimeDuration,
    'Current RPM: ' + Math.round(machine.rpm)
  ].join('\n');

  console.log(message);

  // Twilio (SMS) stub
  // twilioClient.messages.create({ body: message, from: '+1234567890', to: '+0987654321' });

  // WhatsApp Business API stub
  // whatsappClient.sendMessage({ to: '+0987654321', body: message });

  // Nodemailer (Email) stub
  // transporter.sendMail({ from: 'alerts@eco365.com', to: 'maintenance@eco365.com', subject: 'Machine Resolved', text: message });
}
