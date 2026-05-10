<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "traveloop");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);

// --- AUTHENTICATION ---
if ($action == 'signup') {
    $pass = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $data['name'], $data['email'], $pass);
    echo json_encode(["success" => $stmt->execute()]);
}

if ($action == 'login') {
    $stmt = $conn->prepare("SELECT id, name, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $data['email']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    
    if ($user && password_verify($data['password'], $user['password'])) {
        echo json_encode(["success" => true, "user" => ["id" => $user['id'], "name" => $user['name']]]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    }
}

// --- TRIPS & ITINERARY ---
if ($action == 'getTrips') {
    $uid = $_GET['user_id'];
    $res = $conn->query("SELECT * FROM trips WHERE user_id = $uid ORDER BY id DESC");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

if ($action == 'createTrip') {
    $stmt = $conn->prepare("INSERT INTO trips (user_id, name, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issss", $data['user_id'], $data['name'], $data['start'], $data['end'], $data['desc']);
    $stmt->execute();
    echo json_encode(["success" => true, "trip_id" => $conn->insert_id]);
}

if ($action == 'getItinerary') {
    $tid = $_GET['trip_id'];
    // Relational Join: Get all stops and their activities for a specific trip [cite: 23]
    $stops = $conn->query("SELECT * FROM stops WHERE trip_id = $tid");
    $itinerary = [];
    while($stop = $stops->fetch_assoc()) {
        $sid = $stop['id'];
        $acts = $conn->query("SELECT * FROM activities WHERE stop_id = $sid");
        $stop['activities'] = $acts->fetch_all(MYSQLI_ASSOC);
        $itinerary[] = $stop;
    }
    echo json_encode($itinerary);
}

if ($action == 'addStop') {
    $stmt = $conn->prepare("INSERT INTO stops (trip_id, city_name) VALUES (?, ?)");
    $stmt->bind_param("is", $data['trip_id'], $data['city']);
    $stmt->execute();
    echo json_encode(["success" => true]);
}

if ($action == 'addActivity') {
    $stmt = $conn->prepare("INSERT INTO activities (stop_id, title, cost) VALUES (?, ?, ?)");
    $stmt->bind_param("isd", $data['stop_id'], $data['title'], $data['cost']);
    $stmt->execute();
    echo json_encode(["success" => true]);
}
// --- CHECKLIST OPERATIONS --- [cite: 73]
if ($action == 'getChecklist') {
    $tid = $_GET['trip_id'];
    $res = $conn->query("SELECT * FROM checklist WHERE trip_id = $tid");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

if ($action == 'addChecklistItem') {
    $stmt = $conn->prepare("INSERT INTO checklist (trip_id, item_text) VALUES (?, ?)");
    $stmt->bind_param("is", $data['trip_id'], $data['text']);
    echo json_encode(["success" => $stmt->execute()]);
}

if ($action == 'toggleChecklist') {
    $stmt = $conn->prepare("UPDATE checklist SET is_packed = NOT is_packed WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    echo json_encode(["success" => $stmt->execute()]);
}

// --- NOTES OPERATIONS --- [cite: 91]
if ($action == 'getNotes') {
    $tid = $_GET['trip_id'];
    $res = $conn->query("SELECT * FROM notes WHERE trip_id = $tid ORDER BY created_at DESC");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

if ($action == 'addNote') {
    $stmt = $conn->prepare("INSERT INTO notes (trip_id, note_text) VALUES (?, ?)");
    $stmt->bind_param("is", $data['trip_id'], $data['text']);
    echo json_encode(["success" => $stmt->execute()]);
}
?>