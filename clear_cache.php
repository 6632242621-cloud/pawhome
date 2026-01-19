<?php
// Clear all PHP cache
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OPcache cleared!<br>";
}

if (function_exists('apc_clear_cache')) {
    apc_clear_cache();
    echo "APC cache cleared!<br>";
}

echo "<br><strong>Cache cleared successfully!</strong><br>";
echo "<a href='index.html'>Go back to app</a>";
?>
