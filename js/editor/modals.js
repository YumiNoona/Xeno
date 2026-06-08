(function() {
  'use strict';
  var E = window.XenoEditor;

  E.modals = {
    _overlay: null,
    _container: null,

    _init: function() {
      if (this._overlay) return;

      this._overlay = document.createElement('div');
      this._overlay.className = 'modal-overlay';
      this._overlay.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3 id="modal-title"></h3>
          </div>
          <div class="modal-body">
            <p id="modal-message" class="modal-message"></p>
            <div id="modal-input-container" class="modal-input-wrap" style="display:none;">
              <input type="text" id="modal-input" class="modal-input" spellcheck="false">
            </div>
          </div>
          <div class="modal-footer" id="modal-footer"></div>
        </div>
      `;
      document.body.appendChild(this._overlay);

      this._title = this._overlay.querySelector('#modal-title');
      this._message = this._overlay.querySelector('#modal-message');
      this._inputContainer = this._overlay.querySelector('#modal-input-container');
      this._input = this._overlay.querySelector('#modal-input');
      this._footer = this._overlay.querySelector('#modal-footer');
    },

    show: function(options) {
      this._init();
      var self = this;

      return new Promise(function(resolve) {
        self._title.textContent = options.title || 'Notification';
        self._message.textContent = options.message || '';
        
        if (options.showInput) {
          self._inputContainer.style.display = 'block';
          self._input.value = options.inputValue || '';
          setTimeout(function() { self._input.focus(); }, 100);
        } else {
          self._inputContainer.style.display = 'none';
        }

        self._footer.innerHTML = '';
        
        if (options.type === 'confirm' || options.type === 'prompt') {
          var cancelBtn = document.createElement('button');
          cancelBtn.className = 'modal-btn';
          cancelBtn.textContent = options.cancelText || 'Cancel';
          cancelBtn.onclick = function() {
            self.hide();
            resolve(null);
          };
          self._footer.appendChild(cancelBtn);
        }

        var okBtn = document.createElement('button');
        okBtn.className = 'modal-btn modal-btn-primary';
        if (options.isDanger) okBtn.className += ' modal-btn-danger';
        okBtn.textContent = options.okText || 'OK';
        okBtn.onclick = function() {
          var value = options.showInput ? self._input.value : true;
          self.hide();
          resolve(value);
        };
        self._footer.appendChild(okBtn);

        self._overlay.classList.add('visible');

        // Handle Enter key
        var onKeyDown = function(e) {
          if (e.key === 'Enter') {
            okBtn.click();
            document.removeEventListener('keydown', onKeyDown);
          } else if (e.key === 'Escape') {
            if (options.type === 'confirm' || options.type === 'prompt') {
              cancelBtn.click();
            } else {
              okBtn.click();
            }
            document.removeEventListener('keydown', onKeyDown);
          }
        };
        document.addEventListener('keydown', onKeyDown);
      });
    },

    hide: function() {
      if (this._overlay) {
        this._overlay.classList.remove('visible');
      }
    },

    alert: function(message, title) {
      return this.show({
        type: 'alert',
        title: title || '// MESSAGE',
        message: message,
        okText: 'Understood'
      });
    },

    confirm: function(message, title, isDanger) {
      return this.show({
        type: 'confirm',
        title: title || '// CONFIRM',
        message: message,
        okText: 'Confirm',
        cancelText: 'Cancel',
        isDanger: isDanger
      });
    },

    prompt: function(message, defaultValue, title) {
      return this.show({
        type: 'prompt',
        title: title || '// INPUT',
        message: message,
        showInput: true,
        inputValue: defaultValue,
        okText: 'Apply',
        cancelText: 'Cancel'
      });
    }
  };

  // Replace native functions in XenoEditor scope or globally
  E.alert = function(m, t) { return E.modals.alert(m, t); };
  E.confirm = function(m, t, d) { return E.modals.confirm(m, t, d); };
  E.prompt = function(m, d, t) { return E.modals.prompt(m, d, t); };

})();
