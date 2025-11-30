document.addEventListener('DOMContentLoaded', () => {
    // المنت‌ها
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const controlsPanel = document.getElementById('controlsPanel');
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImg');
    const qualityRange = document.getElementById('qualityRange');
    const qualityValue = document.getElementById('qualityValue');
    const formatBtns = document.querySelectorAll('.format-btn');
    const originalSizeEl = document.getElementById('originalSize');
    const newSizeEl = document.getElementById('newSize');
    const savingsEl = document.getElementById('savings');
    const downloadBtn = document.getElementById('downloadBtn');
    const loader = document.getElementById('loader');

    let state = {
        originalFile: null,
        originalImage: new Image(),
        quality: 0.8,
        format: 'image/webp'
    };

    // هندل کردن کلیک و درگ دراپ
    dropZone.addEventListener('click', () => fileInput.click());
    
    // جلوگیری از باز شدن فایل هنگام درگ
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropZone.addEventListener('dragover', () => dropZone.style.borderColor = 'var(--accent)');
    dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = 'var(--border)');
    
    dropZone.addEventListener('drop', (e) => {
        dropZone.style.borderColor = 'var(--border)';
        handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        
        state.originalFile = file;
        originalSizeEl.textContent = formatBytes(file.size);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            state.originalImage.src = e.target.result;
            state.originalImage.onload = () => {
                previewContainer.style.display = 'flex';
                controlsPanel.style.opacity = '1';
                controlsPanel.style.pointerEvents = 'all';
                downloadBtn.classList.remove('disabled');
                compressImage();
            };
        };
        reader.readAsDataURL(file);
    }

    // کنترل‌ها
    qualityRange.addEventListener('input', (e) => {
        state.quality = e.target.value / 100;
        qualityValue.textContent = e.target.value + '%';
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(compressImage, 50);
    });

    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.format = btn.dataset.format;
            compressImage();
        });
    });

    function compressImage() {
        if (!state.originalImage.src) return;
        loader.style.display = 'flex';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = state.originalImage.naturalWidth;
        canvas.height = state.originalImage.naturalHeight;
        
        // بک‌گراند سفید فقط برای JPEG (چون ترنسپرنسی را سیاه می‌کند)
        // برای PNG و WebP بک‌گراند شفاف می‌ماند
        if (state.format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(state.originalImage, 0, 0);

        canvas.toBlob((blob) => {
            newSizeEl.textContent = formatBytes(blob.size);
            
            // محاسبه درصد کاهش (ممکن است منفی باشد اگر حجم زیاد شود)
            const diff = state.originalFile.size - blob.size;
            const percent = (diff / state.originalFile.size) * 100;
            
            if(percent > 0) {
                savingsEl.textContent = `${percent.toFixed(1)}% کاهش`;
                savingsEl.style.color = '#4ade80';
                savingsEl.style.background = 'rgba(34, 197, 94, 0.2)';
            } else {
                savingsEl.textContent = `${Math.abs(percent).toFixed(1)}% افزایش`;
                savingsEl.style.color = '#f87171';
                savingsEl.style.background = 'rgba(248, 113, 113, 0.2)';
            }

            const url = URL.createObjectURL(blob);
            previewImg.src = url;
            
            const ext = state.format.split('/')[1];
            const oldName = state.originalFile.name.split('.')[0];
            downloadBtn.href = url;
            downloadBtn.download = `${oldName}_compressed.${ext}`;
            
            loader.style.display = 'none';
        }, state.format, state.quality);
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
});
س