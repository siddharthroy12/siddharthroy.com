
function deleteImage(src) {
    fetch(src, {
        method: "DELETE",
    }).then(() => {
        window.location.reload()
    })
}