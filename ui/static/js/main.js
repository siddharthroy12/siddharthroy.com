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

function makeImagesClickable() {
  const images = document.getElementsByTagName("img");
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    console.log(image);
    image.style.cursor = "pointer";
    image.onclick = function (e) {
      // Open image in new tab
      window.open(this.src, "_blank");
    };
  }
}

window.addEventListener("load", () => {
  console.log("runn");
  makeImagesClickable();
});
