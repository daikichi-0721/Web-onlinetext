  /* =========================================================
   text-template.html 用 JS（全文）
   - ヘッダー：スクロールで隠す/表示
   - codeブロック：コピー按钮を自動付与
   - 画像：クリックで拡大（ライトボックス）
   - 外部リンク：外部だけ別タブ
   - ハンバーガー：h2(章)から自動で目次生成、×ボタン/背景/ESCで閉じる
   ※ Pandocテンプレートと衝突する `${}` は一切使っていません
   ========================================================= */

(function () {
  "use strict";

  /* =========================
     ヘッダー：スクロールで隠す/表示
     ========================= */
  function setupHeaderAutoHide() {
    const header = document.querySelector(".main-header");
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener(
      "scroll",
      () => {
        const current = window.pageYOffset || 0;
        if (current > lastScroll) header.classList.add("header-hidden");
        else header.classList.remove("header-hidden");
        lastScroll = current;
      },
      { passive: true }
    );
  }

  /* =========================
     codeブロック：コピー按钮を付与
     ========================= */
  function setupCopyButtons() {
    const codeBlocks = document.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      const pre = block.parentNode;
      if (!pre || pre.closest(".code-block")) return; // 二重付与防止

      const wrapper = document.createElement("div");
      wrapper.className = "code-block";

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.type = "button";
      copyBtn.innerText = "コピー";
      wrapper.appendChild(copyBtn);

      copyBtn.addEventListener("click", async () => {
        const text = block.innerText || "";
        try {
          await navigator.clipboard.writeText(text);
          copyBtn.innerText = "コピー完了！";
          setTimeout(() => (copyBtn.innerText = "コピー"), 1500);
        } catch (err) {
          console.error("コピー失敗:", err);
          copyBtn.innerText = "失敗";
          setTimeout(() => (copyBtn.innerText = "コピー"), 1500);
        }
      });
    });
  }

  /* =========================
     画像クリック拡大（ライトボックス）
     - イベント委譲で確実に動作
     ========================= */
  function setupLightbox() {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    if (!lightbox || !lightboxImg) return;

    // 画像クリック → 拡大
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target || !target.closest) return;

      const img = target.closest("img");
      if (!img) return;

      // デモ画像や空srcは拡大しない
      const src = img.getAttribute("src") || "";
      if (!src || src.indexOf("demo.jpg") !== -1) return;

      lightbox.style.display = "flex";
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || "";
    });

    // ライトボックスクリックで閉じる
    lightbox.addEventListener("click", () => {
      lightbox.style.display = "none";
      lightboxImg.src = "";
    });

    // ESCで閉じる
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (lightbox.style.display === "flex") {
          lightbox.style.display = "none";
          lightboxImg.src = "";
        }
      }
    });
  }

  /* =========================
     外部リンクだけ別タブ
     ========================= */
  function setupExternalLinks() {
    const links = document.querySelectorAll("a[href]");
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href) return;

      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
      } catch (_) {
        // 無効URLは無視
      }
    });
  }

  /* =========================
     ハンバーガーメニュー：章目次自動生成
     - h2を章として拾う
     - idが無ければ自動付与
     - ×ボタン/背景/ESC/ボタン再タップで閉じる
     ========================= */
  function setupHamburgerMenu() {
    const toggleBtn = document.getElementById("menuToggle");
    const panel = document.getElementById("menuPanel");
    const list = document.getElementById("menuList");
    const backdrop = document.getElementById("menuBackdrop");
    const closeBtn = document.getElementById("menuClose");
    const main = document.querySelector("main.container") || document.body;

    if (!toggleBtn || !panel || !list || !backdrop) return;

    // 既に何か入ってたら二重生成しない
    if (list.childElementCount > 0) return;

    const slugify = (s) => {
      return (s || "")
        .trim()
        .toLowerCase()
        .replace(/[！!]/g, "")
        .replace(/[、。,．.]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf\-]/g, "");
    };

    function openMenu() {
      toggleBtn.classList.add("active");
      panel.classList.add("active");
      toggleBtn.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
      backdrop.hidden = false;
      document.body.classList.add("menu-open");
    }

    function closeMenu() {
      toggleBtn.classList.remove("active");
      panel.classList.remove("active");
      toggleBtn.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      backdrop.hidden = true;
      document.body.classList.remove("menu-open");
    }

    // 章（h2）を拾って一覧化
    const headings = Array.from(main.querySelectorAll("h2"));

    headings.forEach((h, idx) => {
      if (!h.id) {
        const base = slugify(h.textContent) || "chapter-" + (idx + 1);
        let id = base;
        let n = 2;
        while (document.getElementById(id)) {
          id = base + "-" + n;
          n++;
        }
        h.id = id;
      }

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent || ("章 " + (idx + 1));

      a.addEventListener("click", (e) => {
        e.preventDefault();
        const y = h.getBoundingClientRect().top + window.pageYOffset - 64; // ヘッダー分
        window.scrollTo({ top: y, behavior: "smooth" });
        closeMenu();
      });

      li.appendChild(a);
      list.appendChild(li);
    });

    // 開閉イベント
    toggleBtn.addEventListener("click", () => {
      const isOpen = panel.classList.contains("active");
      if (isOpen) closeMenu();
      else openMenu();
    });

    backdrop.addEventListener("click", closeMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* =========================
     起動
     ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    setupHeaderAutoHide();
    setupCopyButtons();
    setupLightbox();
    setupExternalLinks();
    setupHamburgerMenu();
  });
})();
