<?php
require_once __DIR__ . '/../config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// Get messages for a match
if ($action === 'list') {
    $matchId = $data['match_id'] ?? 0;
    
    try {
        $stmt = $conn->prepare("
            SELECT m.*, u.username as sender_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.match_id = :match_id
            ORDER BY m.created_at ASC
        ");
        
        $stmt->execute(['match_id' => $matchId]);
        $messages = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'messages' => $messages]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Send a message
elseif ($action === 'send') {
    $matchId = $data['match_id'] ?? 0;
    $senderId = $data['sender_id'] ?? 0;
    $message = $data['message'] ?? '';
    
    if (empty($message)) {
        echo json_encode(['success' => false, 'message' => 'ข้อความว่างเปล่า']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO messages (match_id, sender_id, message)
            VALUES (:match_id, :sender_id, :message)
        ");
        
        $stmt->execute([
            'match_id' => $matchId,
            'sender_id' => $senderId,
            'message' => $message
        ]);
        
        echo json_encode([
            'success' => true, 
            'message_id' => $conn->lastInsertId(),
            'message' => 'ส่งข้อความสำเร็จ'
        ]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Mark messages as read
elseif ($action === 'mark-read') {
    $matchId = $data['match_id'] ?? 0;
    $userId = $data['user_id'] ?? 0;
    
    try {
        $stmt = $conn->prepare("
            UPDATE messages 
            SET is_read = 1 
            WHERE match_id = :match_id AND sender_id != :user_id
        ");
        
        $stmt->execute(['match_id' => $matchId, 'user_id' => $userId]);
        
        echo json_encode(['success' => true]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>