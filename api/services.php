<?php
require_once __DIR__ . '/../config.php';

$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// List all services
if ($action === 'list') {
    try {
        $stmt = $conn->prepare("
            SELECT s.*, u.username as owner_name 
            FROM services s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        ");
        $stmt->execute();
        $services = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'services' => $services]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Get services by user (for business dashboard)
elseif ($action === 'my-services') {
    $userId = $data['user_id'] ?? 0;
    
    try {
        $stmt = $conn->prepare("SELECT * FROM services WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->execute(['user_id' => $userId]);
        $services = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'services' => $services]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Add new service
elseif ($action === 'add') {
    $userId = $data['user_id'] ?? 0;
    $name = $data['name'] ?? '';
    $type = $data['type'] ?? 'other';
    $imageUrl = $data['image_url'] ?? '';
    $price = $data['price'] ?? '';
    $description = $data['description'] ?? '';
    $category = $data['category'] ?? '';
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO services (user_id, name, type, image_url, price, description, category)
            VALUES (:user_id, :name, :type, :image_url, :price, :description, :category)
        ");
        
        $stmt->execute([
            'user_id' => $userId,
            'name' => $name,
            'type' => $type,
            'image_url' => $imageUrl,
            'price' => $price,
            'description' => $description,
            'category' => $category
        ]);
        
        echo json_encode(['success' => true, 'message' => 'เพิ่มบริการสำเร็จ', 'service_id' => $conn->lastInsertId()]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Update service
elseif ($action === 'update') {
    $serviceId = $data['id'] ?? 0;
    $name = $data['name'] ?? '';
    $type = $data['type'] ?? 'other';
    $imageUrl = $data['image_url'] ?? '';
    $price = $data['price'] ?? '';
    $description = $data['description'] ?? '';
    $category = $data['category'] ?? '';
    
    try {
        $stmt = $conn->prepare("
            UPDATE services SET
                name = :name,
                type = :type,
                image_url = :image_url,
                price = :price,
                description = :description,
                category = :category
            WHERE id = :id
        ");
        
        $stmt->execute([
            'id' => $serviceId,
            'name' => $name,
            'type' => $type,
            'image_url' => $imageUrl,
            'price' => $price,
            'description' => $description,
            'category' => $category
        ]);
        
        echo json_encode(['success' => true, 'message' => 'แก้ไขสำเร็จ']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Delete service
elseif ($action === 'delete') {
    $serviceId = $data['id'] ?? 0;
    
    try {
        $stmt = $conn->prepare("DELETE FROM services WHERE id = :id");
        $stmt->execute(['id' => $serviceId]);
        
        echo json_encode(['success' => true, 'message' => 'ลบสำเร็จ']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>