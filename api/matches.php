<?php
// Clear OPcache if enabled
if (function_exists('opcache_reset')) {
    opcache_reset();
}

require_once __DIR__ . '/../config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// Get user's matches
if ($action === 'list') {
    $userId = $data['user_id'] ?? 0;
    
    error_log("Matches API v2 - Loading matches for user: " . $userId); // Debug log
    
    try {
        $stmt = $conn->prepare("
            SELECT 
                m.*,
                p.name as pet_name,
                p.image_url as pet_image,
                u.username as matched_user_name,
                u.email as matched_user_email
            FROM matches m
            JOIN pets p ON m.pet_id = p.id
            JOIN users u ON (
                CASE 
                    WHEN m.user1_id = :user_id THEN m.user2_id
                    ELSE m.user1_id
                END = u.id
            )
            WHERE m.user1_id = :user_id OR m.user2_id = :user_id
            ORDER BY m.created_at DESC
        ");
        
        $stmt->execute(['user_id' => $userId]);
        $matches = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'matches' => $matches]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Check for new matches when someone likes
elseif ($action === 'check') {
    $userId = $data['user_id'] ?? 0;
    $petId = $data['pet_id'] ?? 0;
    
    try {
        // Check if the other user also liked us
        $stmt = $conn->prepare("
            SELECT pl2.*, p.user_id as other_user_id
            FROM pet_likes pl1
            JOIN pet_likes pl2 ON pl1.pet_id = pl2.user_id AND pl2.pet_id = pl1.user_id
            JOIN pets p ON pl1.pet_id = p.id
            WHERE pl1.user_id = :user_id AND pl1.pet_id = :pet_id
            AND NOT EXISTS (
                SELECT 1 FROM matches 
                WHERE pet_id = :pet_id 
                AND ((user1_id = :user_id AND user2_id = p.user_id)
                   OR (user1_id = p.user_id AND user2_id = :user_id))
            )
        ");
        
        $stmt->execute(['user_id' => $userId, 'pet_id' => $petId]);
        $mutualLikes = $stmt->fetchAll();
        
        // Create matches for mutual likes
        foreach ($mutualLikes as $like) {
            $insertStmt = $conn->prepare("
                INSERT INTO matches (user1_id, user2_id, pet_id)
                VALUES (:user1_id, :user2_id, :pet_id)
            ");
            $insertStmt->execute([
                'user1_id' => $userId,
                'user2_id' => $like['other_user_id'],
                'pet_id' => $petId
            ]);
        }
        
        echo json_encode(['success' => true, 'new_matches' => count($mutualLikes)]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>