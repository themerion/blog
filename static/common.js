(function () {
    if (document.readyState === "interactive" || document.readyState === "complete")
        init();
    else
        document.addEventListener("DOMContentLoaded", init);

    function init() {
        try { initTabs(); } catch(e) { console.error(e); }
        try { styleTagBackgrounds(); } catch(e) { console.error(e); }
    }

    // === TAGS ===
    function styleTagBackgrounds() {
        var tagElements = document.querySelectorAll(".tag-container .tag");
        var backgrounds = [
            ["javascript", "tomato"],
            ["functional", "dodgerblue"]
        ];
        for (var element of tagElements) {
            var background = backgrounds.find(function (bg) {
                return bg[0] === element.innerHTML.trim();
            });
            if (background) {
                element.style.backgroundColor = background[1];
            }
        }
    }

    // === TABS ===
    function initTabs() {
        function selectButton(element) {
            element.style.fontWeight = "bold"; element.style.textDecoration = "underline";
        }
        function deselectButton(element) {
            element.style.fontWeight = "normal"; element.style.textDecoration = "none";
        }

        var tabPanes = document.querySelectorAll(".tab-pane");
        for (var i = 0; i < tabPanes.length; i++) {
            (function () {
                var tabPane = tabPanes[i];
                var tabList = document.createElement("div");
                var tabNodes = tabPane.querySelectorAll(".tab");
                var hideTabs = function () { for (var n = 0; n < tabNodes.length; n++) tabNodes[n].style.display = "none"; };
                var deselectButtons = function () {
                    var button = tabList.firstElementChild;
                    do {
                        deselectButton(button);
                    } while (button = button.nextElementSibling)
                };

                for (var j = 0; j < tabNodes.length; j++) {
                    (function () {
                        var tab = tabNodes[j];
                        var label = document.createElement("span");
                        label.innerHTML = tab.getAttribute("data-title");
                        label.classList = "tab-button";
                        label.addEventListener("click", function () { hideTabs(); tab.style.display = "block"; deselectButtons(); selectButton(label); });
                        tabList.appendChild(label);
                    })();
                }

                hideTabs();
                tabNodes[0].style.display = "block";
                selectButton(tabList.firstChild);
                tabPane.insertBefore(tabList, tabPane.firstChild);
            })();
        }
    }

    // === HIDDEN PANEL ===
    class HiddenPanel extends HTMLElement {
        connectedCallback() {
            this.innerHTML = `<p>Ok</p>`
        }
    }
    window.customElements.define("hidden-panel", HiddenPanel);
})();