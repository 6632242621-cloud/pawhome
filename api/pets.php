<?php
require_once '../config.php';

// รับ action จาก GET หรือจาก POST body
$action = $_GET['action'] ?? '';
if (empty($action)) {
    $inputData = json_decode(file_get_contents('php://input'), true);
    $action = $inputData['action'] ?? '';
}

$data = json_decode(file_get_contents('php://input'), true);

// ดึงรายการสัตว์เลี้ยงทั้งหมด
if ($action === 'list') {
    try {
        $stmt = $conn->query("
            SELECT 
                p.*,
                u.username as caregiver_name,
                u.email as caregiver_email,
                u.role as caregiver_role
            FROM pets p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.status = 'available'
            ORDER BY p.created_at DESC
        ");
        
        $pets = $stmt->fetchAll();
        
        // แปลง JSON tags เป็น array
        foreach ($pets as &$pet) {
            $pet['tags'] = json_decode($pet['tags'], true);
        }
        
        echo json_encode(['success' => true, 'pets' => $pets]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// ดึงข้อมูลสัตว์เลี้ยงตัวเดียว
elseif ($action === 'get') {
    $petId = $_GET['id'] ?? 0;
    
    try {
        $stmt = $conn->prepare("
            SELECT 
                p.*,
                u.username as caregiver_name,
                u.email as caregiver_email,
                u.role as caregiver_role
            FROM pets p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = :id
        ");
        $stmt->execute(['id' => $petId]);
        $pet = $stmt->fetch();
        
        if ($pet) {
            $pet['tags'] = json_decode($pet['tags'], true);
            echo json_encode(['success' => true, 'pet' => $pet]);
        } else {
            echo json_encode(['success' => false, 'message' => 'ไม่พบข้อมูล']);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// เพิ่มสัตว์เลี้ยงใหม่
elseif ($action === 'add') {
    $userId = $data['user_id'] ?? 0;
    $name = $data['name'] ?? '';
    $age = $data['age'] ?? '';
    $breed = $data['breed'] ?? '';
    $imageUrl = $data['image_url'] ?? '';
    $tags = json_encode($data['tags'] ?? []);
    $description = $data['description'] ?? '';
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO pets (user_id, name, age, breed, image_url, tags, description)
            VALUES (:user_id, :name, :age, :breed, :image_url, :tags, :description)
        ");
        
        $stmt->execute([
            'user_id' => $userId,
            'name' => $name,
            'age' => $age,
            'breed' => $breed,
            'image_url' => $imageUrl,
            'tags' => $tags,
            'description' => $description
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'เพิ่มสัตว์เลี้ยงสำเร็จ',
            'pet_id' => $conn->lastInsertId()
        ]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// กดถูกใจ
elseif ($action === 'like') {
    $userId = $data['user_id'] ?? 0;
    $petId = $data['pet_id'] ?? 0;
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO pet_likes (user_id, pet_id)
            VALUES (:user_id, :pet_id)
        ");
        
        $stmt->execute([
            'user_id' => $userId,
            'pet_id' => $petId
        ]);
        
        echo json_encode(['success' => true, 'message' => 'กดถูกใจสำเร็จ']);
    } catch(PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['success' => false, 'message' => 'คุณกดถูกใจแล้ว']);
        } else {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}

// แก้ไขสัตว์เลี้ยง
elseif ($action === 'update') {
    $petId = $data['id'] ?? 0;
    $userId = $data['user_id'] ?? 0;
    $name = $data['name'] ?? '';
    $age = $data['age'] ?? '';
    $breed = $data['breed'] ?? '';
    $imageUrl = $data['image_url'] ?? '';
    $tags = json_encode($data['tags'] ?? []);
    $description = $data['description'] ?? '';
    $status = $data['status'] ?? 'available';
    
    try {
        $stmt = $conn->prepare("
            UPDATE pets SET
                name = :name,
                age = :age,
                breed = :breed,
                image_url = :image_url,
                tags = :tags,
                description = :description,
                status = :status
            WHERE id = :id
        ");
        
        $stmt->execute([
            'id' => $petId,
            'name' => $name,
            'age' => $age,
            'breed' => $breed,
            'image_url' => $imageUrl,
            'tags' => $tags,
            'description' => $description,
            'status' => $status
        ]);
        
        echo json_encode(['success' => true, 'message' => 'แก้ไขข้อมูลสำเร็จ']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// ลบสัตว์เลี้ยง
elseif ($action === 'delete') {
    $petId = $data['id'] ?? 0;
    
    try {
        $stmt = $conn->prepare("DELETE FROM pets WHERE id = :id");
        $stmt->execute(['id' => $petId]);
        
        echo json_encode(['success' => true, 'message' => 'ลบสำเร็จ']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'ไม่สามารถลบได้: ' . $e->getMessage()]);
    }
}

else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>
