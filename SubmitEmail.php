<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $company = htmlspecialchars($_POST['company']);
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $phone = htmlspecialchars($_POST['phone']);
    $message = htmlspecialchars($_POST['message']);

    $to = "wayne.romanishan@live.com";
    $subject = "Consultation Request";

    $emailBody = "
    <html>
    <head>
        <title>Consultation Request</title>
    </head>
    <body>
        <p><strong>Company Name:</strong> $company</p>
        <p><strong>Name:</strong> $name</p>
        <p><strong>Email:</strong> $email</p>
        <p><strong>Phone:</strong> $phone</p>
        <p><strong>Message:</strong></p>
        <p>$message</p>
    </body>
    </html>";

    $headers = "From: wayne.romanishan@live.com\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";

    // Send the email
    if (mail($to, $subject, $emailBody, $headers)) {
        echo "Email sent successfully.";
    } else {
        echo "Failed to send email.";
    }
}
?>
