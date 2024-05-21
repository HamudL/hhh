document.addEventListener('DOMContentLoaded', function () {
    const openSidebarMenu = document.getElementById('openSidebarMenu');
    const galleryContainer = document.querySelector('.GalleryContainer');

    openSidebarMenu.addEventListener('change', function () {
        if (openSidebarMenu.checked) {
            galleryContainer.style.display = 'none'; // Hide the gallery when the sidebar is open
        } else {
            galleryContainer.style.display = 'flex'; // Show the gallery when the sidebar is closed
        }
    });
});
