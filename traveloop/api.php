<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$conn = new mysqli("localhost", "root", "", "traveloop");
if ($conn->connect_error) die(json_encode(["error" => "Connection failed"]));

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);

// ===================== AUTH =====================
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

// ===================== PROFILE =====================
if ($action == 'getProfile') {
    $uid = $_GET['user_id'];
    $stmt = $conn->prepare("SELECT id, name, email FROM users WHERE id = ?");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_assoc());
}

if ($action == 'updateProfile') {
    $stmt = $conn->prepare("UPDATE users SET name = ? WHERE id = ?");
    $stmt->bind_param("si", $data['name'], $data['user_id']);
    echo json_encode(["success" => $stmt->execute()]);
}

// ===================== TRIPS =====================
if ($action == 'getTrips') {
    $uid = $_GET['user_id'];
    $stmt = $conn->prepare("SELECT t.*, (SELECT COUNT(*) FROM stops WHERE trip_id = t.id) as stop_count FROM trips t WHERE t.user_id = ? ORDER BY t.id DESC");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
}

if ($action == 'createTrip') {
    $share = bin2hex(random_bytes(8));
    $stmt = $conn->prepare("INSERT INTO trips (user_id, name, start_date, end_date, description, share_code) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssss", $data['user_id'], $data['name'], $data['start'], $data['end'], $data['desc'], $share);
    $stmt->execute();
    echo json_encode(["success" => true, "trip_id" => $conn->insert_id]);
}

if ($action == 'deleteTrip') {
    $tid = $data['trip_id'];
    // Delete related data first (cascade)
    $conn->query("DELETE FROM notes WHERE trip_id = $tid");
    $conn->query("DELETE FROM checklist WHERE trip_id = $tid");
    $conn->query("DELETE a FROM activities a JOIN stops s ON a.stop_id = s.id WHERE s.trip_id = $tid");
    $conn->query("DELETE FROM stops WHERE trip_id = $tid");
    $stmt = $conn->prepare("DELETE FROM trips WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $data['trip_id'], $data['user_id']);
    echo json_encode(["success" => $stmt->execute()]);
}

if ($action == 'toggleShareTrip') {
    $stmt = $conn->prepare("UPDATE trips SET is_public = NOT is_public WHERE id = ?");
    $stmt->bind_param("i", $data['trip_id']);
    $stmt->execute();
    $stmt2 = $conn->prepare("SELECT is_public, share_code FROM trips WHERE id = ?");
    $stmt2->bind_param("i", $data['trip_id']);
    $stmt2->execute();
    echo json_encode($stmt2->get_result()->fetch_assoc());
}

// ===================== SHARED/PUBLIC VIEW =====================
if ($action == 'getSharedTrip') {
    $code = $_GET['code'] ?? '';
    $stmt = $conn->prepare("SELECT * FROM trips WHERE share_code = ? AND is_public = 1");
    $stmt->bind_param("s", $code);
    $stmt->execute();
    $trip = $stmt->get_result()->fetch_assoc();
    if (!$trip) { echo json_encode(["error" => "Not found"]); exit; }
    // Get itinerary
    $stops = $conn->query("SELECT * FROM stops WHERE trip_id = {$trip['id']} ORDER BY sort_order");
    $itin = [];
    while ($s = $stops->fetch_assoc()) {
        $acts = $conn->query("SELECT * FROM activities WHERE stop_id = {$s['id']}");
        $s['activities'] = $acts->fetch_all(MYSQLI_ASSOC);
        $itin[] = $s;
    }
    $trip['itinerary'] = $itin;
    echo json_encode($trip);
}

// ===================== ITINERARY =====================
if ($action == 'getItinerary') {
    $tid = $_GET['trip_id'];
    $stops = $conn->query("SELECT * FROM stops WHERE trip_id = $tid ORDER BY sort_order, id");
    $itinerary = [];
    while ($stop = $stops->fetch_assoc()) {
        $sid = $stop['id'];
        $acts = $conn->query("SELECT * FROM activities WHERE stop_id = $sid ORDER BY time_slot");
        $stop['activities'] = $acts->fetch_all(MYSQLI_ASSOC);
        $itinerary[] = $stop;
    }
    echo json_encode($itinerary);
}

if ($action == 'addStop') {
    $stmt = $conn->prepare("INSERT INTO stops (trip_id, city_name, sort_order, arrival_date) VALUES (?, ?, ?, ?)");
    $order = $data['sort_order'] ?? 0;
    $date = $data['arrival_date'] ?? null;
    $stmt->bind_param("isis", $data['trip_id'], $data['city'], $order, $date);
    $stmt->execute();
    echo json_encode(["success" => true, "stop_id" => $conn->insert_id]);
}

if ($action == 'deleteStop') {
    $conn->query("DELETE FROM activities WHERE stop_id = {$data['stop_id']}");
    $stmt = $conn->prepare("DELETE FROM stops WHERE id = ?");
    $stmt->bind_param("i", $data['stop_id']);
    echo json_encode(["success" => $stmt->execute()]);
}

if ($action == 'reorderStops') {
    foreach ($data['order'] as $i => $stopId) {
        $stmt = $conn->prepare("UPDATE stops SET sort_order = ? WHERE id = ?");
        $stmt->bind_param("ii", $i, $stopId);
        $stmt->execute();
    }
    echo json_encode(["success" => true]);
}

if ($action == 'addActivity') {
    $cat = $data['category'] ?? 'activity';
    $time = $data['time_slot'] ?? null;
    $stmt = $conn->prepare("INSERT INTO activities (stop_id, title, cost, category, time_slot) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("isdss", $data['stop_id'], $data['title'], $data['cost'], $cat, $time);
    $stmt->execute();
    echo json_encode(["success" => true]);
}

if ($action == 'deleteActivity') {
    $stmt = $conn->prepare("DELETE FROM activities WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    echo json_encode(["success" => $stmt->execute()]);
}

// ===================== CHECKLIST =====================
if ($action == 'getChecklist') {
    $tid = $_GET['trip_id'];
    $res = $conn->query("SELECT * FROM checklist WHERE trip_id = $tid ORDER BY category, id");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

if ($action == 'addChecklistItem') {
    $cat = $data['category'] ?? 'general';
    $stmt = $conn->prepare("INSERT INTO checklist (trip_id, item_text, category) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $data['trip_id'], $data['text'], $cat);
    echo json_encode(["success" => $stmt->execute()]);
}

if ($action == 'toggleChecklist') {
    $stmt = $conn->prepare("UPDATE checklist SET is_packed = NOT is_packed WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    echo json_encode(["success" => $stmt->execute()]);
}

if ($action == 'deleteChecklistItem') {
    $stmt = $conn->prepare("DELETE FROM checklist WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    echo json_encode(["success" => $stmt->execute()]);
}

if ($action == 'resetChecklist') {
    $stmt = $conn->prepare("UPDATE checklist SET is_packed = 0 WHERE trip_id = ?");
    $stmt->bind_param("i", $data['trip_id']);
    echo json_encode(["success" => $stmt->execute()]);
}

// ===================== NOTES =====================
if ($action == 'getNotes') {
    $tid = $_GET['trip_id'];
    $res = $conn->query("SELECT * FROM notes WHERE trip_id = $tid ORDER BY created_at DESC");
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));
}

if ($action == 'addNote') {
    $stopId = $data['stop_id'] ?? null;
    $stmt = $conn->prepare("INSERT INTO notes (trip_id, note_text, stop_id) VALUES (?, ?, ?)");
    $stmt->bind_param("isi", $data['trip_id'], $data['text'], $stopId);
    echo json_encode(["success" => $stmt->execute()]);
}

if ($action == 'deleteNote') {
    $stmt = $conn->prepare("DELETE FROM notes WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    echo json_encode(["success" => $stmt->execute()]);
}
?>