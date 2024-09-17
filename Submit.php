<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

$serverName = "DrDymytri\DRDYMYTRI"; // or the name of your server
$connectionOptions = array(
    "Database" => "consultation_services",
    "Uid" => "Connect",
    "PWD" => "Connect"
);

// Establishes the connection
$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    die(print_r(sqlsrv_errors(), true));
}

// Prepare and execute the query
$sql = "INSERT INTO Customers (Name, Email, Phone, Message) VALUES (?, ?, ?, ?)";
$params = array($_POST['Name'], $_POST['Email'], $_POST['Phone'], $_POST['Message']);
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    die(print_r(sqlsrv_errors(), true));
} else {
    echo "New record created successfully";
}

// Close the connection
sqlsrv_close($conn);
?>
