<?php
require_once __DIR__ . '/../config.php';

// Get action
$action = $_GET['action'] ?? '';
if (empty($action)) {
    $inputData = json_decode(file_get_contents('php://input'), true);
    $action = $inputData['action'] ?? '';
}

$data = json_decode(file_get_contents('php://input'), true);

// Get statistics
if ($action === 'stats') {
    try {
        $stats = [];
        
        // Total users
        $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
        $stats['total_users'] = $stmt->fetch()['count'];
        
        // Total pets
        $stmt = $conn->query("SELECT COUNT(*) as count FROM pets");
        $stats['total_pets'] = $stmt->fetch()['count'];
        
        // Total likes
        $stmt = $conn->query("SELECT COUNT(*) as count FROM pet_likes");
        $stats['total_likes'] = $stmt->fetch()['count'];
        
        // Total matches
        $stmt = $conn->query("SELECT COUNT(*) as count FROM matches");
        $stats['total_matches'] = $stmt->fetch()['count'];
        
        echo json_encode(['success' => true, 'stats' => $stats]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get all users
elseif ($action === 'users') {
    try {
        $stmt = $conn->query("
            SELECT id, username, email, role, created_at
            FROM users
            ORDER BY created_at DESC
        ");
        $users = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'users' => $users]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get all likes
elseif ($action === 'likes') {
    try {
        $stmt = $conn->query("
            SELECT 
                l.id,
                l.created_at,
                u.username,
                p.name as pet_name
            FROM pet_likes l
            JOIN users u ON l.user_id = u.id
            JOIN pets p ON l.pet_id = p.id
            ORDER BY l.created_at DESC
        ");
        $likes = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'likes' => $likes]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get all matches
elseif ($action === 'matches') {
    try {
        $stmt = $conn->query("
            SELECT 
                m.id,
                m.status,
                m.created_at,
                u1.username as user1_name,
                u2.username as user2_name,
                p.name as pet_name
            FROM matches m
            JOIN users u1 ON m.user1_id = u1.id
            JOIN users u2 ON m.user2_id = u2.id
            JOIN pets p ON m.pet_id = p.id
            ORDER BY m.created_at DESC
        ");
        $matches = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'matches' => $matches]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Delete user
elseif ($action === 'deleteUser') {
    $userId = $data['user_id'] ?? 0;
    
    try {
        $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute(['id' => $userId]);
        
        echo json_encode(['success' => true, 'message' => 'ลบผู้ใช้สำเร็จ']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'ไม่สามารถลบได้: ' . $e->getMessage()]);
    }
}

else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>
