<?php
// ตั้งค่า Headers สำหรับ CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth');

// Handle Preflight Request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// API Backend URL
$apiBase = 'http://sea.main.rainbowcreation.net:8000';

// รับ path จาก query parameter
$path = $_GET['path'] ?? '';
$url = $apiBase . $path;

// รับ HTTP Method
$method = $_SERVER['REQUEST_METHOD'];

// เตรียม Headers
$headers = [];
$headers[] = 'Content-Type: application/json';

// Forward X-Auth header (token)
if (isset($_SERVER['HTTP_X_AUTH'])) {
    $headers[] = 'X-Auth: ' . $_SERVER['HTTP_X_AUTH'];
}

// เตรียม cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// ถ้าเป็น POST, PUT, PATCH ให้ส่ง body ไปด้วย
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

// เรียก API
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// ถ้ามี error จาก cURL
if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL Error: ' . $curlError]);
    exit();
}

// ส่ง HTTP status code กลับไป
http_response_code($httpCode);

// ส่ง response กลับไป
echo $response;
?>