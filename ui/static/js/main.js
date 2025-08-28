function deleteImage(src) {
  fetch(src, {
    method: "DELETE",
  }).then(() => {
    window.location.reload();
  });
}

function deletePost(src) {
  let result = confirm(`Are you sure you want to delte ${src}?`);
  if (result) {
    fetch(src, {
      method: "DELETE",
    }).then(() => {
      window.location.reload();
    });
  }
}
