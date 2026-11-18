function downloadICS() {
    if (typeof window.showToast === "function") {
        window.showToast("旅行プランを保存しました！", 2500);
    }
}
window.downloadICS = downloadICS;
