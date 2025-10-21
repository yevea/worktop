<?php
require_once 'config.php';

// Set content type to JSON
header('Content-Type: application/json');

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['length']) || !isset($input['width']) || !isset($input['thickness']) || !isset($input['area']) || !isset($input['price'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
}

// Validate dimensions
$length = (float)$input['length'];
$width = (float)$input['width'];
$thickness = (int)$input['thickness'];
$area = (float)$input['area'];
$price = (float)$input['price'];

if ($length < 300 || $length > 4000 || $width < 300 || $width > 1200) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid dimensions']);
    exit;
}

// Initialize Stripe
\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

try {
    // Create checkout session
    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => 'gbp',
                'product_data' => [
                    'name' => "Custom Wood Worktop ({$length}mm x {$width}mm x {$thickness}mm)",
                    'description' => "Premium hardwood worktop - Area: {$area}m²",
                ],
                'unit_amount' => (int)($price * 100), // Convert to pence
            ],
            'quantity' => 1,
        ]],
        'mode' => 'payment',
        'success_url' => $_SERVER['HTTP_ORIGIN'] . '/success.html?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => $_SERVER['HTTP_ORIGIN'] . '/cancel.html',
    ]);
    
    echo json_encode(['id' => $session->id]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
