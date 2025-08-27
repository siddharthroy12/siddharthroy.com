function toggleTheme() {
  fetch("/toggledark", {
    method: "PUT",
  }).then(() => {
    window.location.reload();
  });
}
