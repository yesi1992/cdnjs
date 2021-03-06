/*
 * botui 0.1.2
 * A JS library to build the UI for your bot
 * https://botui.moin.im
 *
 * Copyright 2017, Moin Uddin (https://moin.im)
 * Released under the MIT license.
*/

(function (root, factory) {
  "use strict";
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return (root.BotUI = factory(root));
    });
  } else {
    root.BotUI = factory(root);
  }
}(typeof window !== 'undefined' ? window : this, function (root, undefined) {
  "use strict";

  var BotUI = (function (id, opts) {

    opts = opts || {};

    if(!id) {
      throw Error('BotUI: Container id is required as first argument.');
    }

    if(!document.getElementById(id)) {
      throw Error('BotUI: Element with id #' + id + ' does not exist.');
    }

    if(!root.Vue && !opts.vue) {
      throw Error('BotUI: Vue is required but not found.');
    }

    var _botApp, // current vue instance.
    _options = {
      debug: false,
      fontawesome: true
    },
    _interface = {}, // methods returned by a BotUI() instance.
    _actionResolve,
    _markDownRegex = {
      icon: /!\(([^\)]+)\)/igm, // !(icon)
      image: /!\[(.*?)\]\((.*?)\)/igm, // ![aleternate text](src)
      link: /\[([^\[]+)\]\(([^\)]+)\)(\^?)/igm // [text](link) ^ can be added at end to set the target as 'blank'
    },
    _fontAwesome = 'https://use.fontawesome.com/ea731dcb6f.js',
    _esPromisePollyfill = 'https://cdn.jsdelivr.net/es6-promise/4.1.0/es6-promise.min.js'; // mostly for IE

    root.Vue = root.Vue || opts.vue;

    // merge opts passed to constructor with _options
    for (var prop in _options) {
      if (opts.hasOwnProperty(prop)) {
        _options[prop] = opts[prop];
      }
    }

    if(!root.Promise && !Promise && !options.promise) {
      loadScript(_esPromisePollyfill);
    }

    function _linkReplacer(match, $1, $2, $3) {
      var _target = $3 ? 'blank' : ''; // check if '^' sign is present with link syntax
      return "<a class='botui-message-content-link' target='" + _target + "' href='" + $2 +"'>" + $1 + "</a>";
    }

    function _parseMarkDown(text) {
      return text
                 .replace(_markDownRegex.image, "<img class='botui-message-content-image' src='$2' alt='$1' />")
                 .replace(_markDownRegex.icon, "<i class='botui-icon botui-message-content-icon fa fa-$1'></i>")
                 .replace(_markDownRegex.link, _linkReplacer);
    }

    function loadScript(src, cb) {
      var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = src;

          if(cb) {
            script.onload = cb;
          }

      document.body.appendChild(script);
    }

    function _handleAction(text) {
      if(_instance.action.addMessage) {
        _interface.message.human({
          delay: 100,
          content: text
        });
      }
      _instance.action.show = !_instance.action.autoHide;
    }

    var _botuiComponent = {
      template: '<div class=\"botui botui-container\"><div class=\"botui-messages-container\"><div v-for=\"msg in messages\"><transition name=\"slide-fade\"><div class=\"botui-message\" v-if=\"msg.visible\" :class=\"msg.cssClass\"><div :class=\"[{human: msg.human, \'botui-message-content\': true}, msg.type]\" v-botui-scroll><span v-if=\"msg.type == \'text\'\" v-text=\"msg.content\" v-botui-markdown></span> <iframe v-if=\"msg.type == \'embed\'\" :src=\"msg.content\" frameborder=\"0\" allowfullscreen></iframe></div></div></transition></div></div><div class=\"botui-actions-container\"><transition name=\"slide-fade\"><div v-if=\"action.show\" v-botui-scroll><form v-if=\"action.type == \'text\'\" class=\"botui-actions-text\" @submit.prevent=\"handle_action_text()\" :class=\"action.cssClass\"> <input type=\"text\" ref=\"input\" :type=\"action.text.sub_type\" v-model=\"action.text.value\" class=\"botui-actions-text-input\" :placeholder=\"action.text.placeholder\" :size=\"action.text.size\" :value=\"action.text.value\" :value=\"action.text.cssClass\" required/> <button v-if=\"isMobile\" class=\"botui-actions-text-submit\">Go</button></form><div v-if=\"action.type == \'button\'\" class=\"botui-actions-buttons\" :class=\"action.cssClass\"> <button type=\"button\" :class=\"button.cssClass\" class=\"botui-actions-buttons-button\" v-for=\"button in action.button.buttons\" @click=\"handle_action_button(button)\" autofocus><i v-if=\"button.icon\" class=\"botui-icon botui-action-button-icon fa\" :class=\"\'fa-\' + button.icon\"></i> {{button.text}}</button></div></div></transition></div></div>', // replaced by HTML template during build. see Gulpfile.js
      data: function () {
        return {
          action: {
            text: {
              size: 30,
              placeholder: 'Write here ..'
            },
            button: {},
            show: false,
            type: 'text',
            autoHide: true,
            addMessage: true
          },
          messages: []
        };
      },
      computed: {
        isMobile: function () {
          return root.innerWidth && root.innerWidth <= 768;
        }
      },
    	methods: {
    		handle_action_button: function (button) {
          _handleAction(button.text);
          _actionResolve({
            type: 'button',
            text: button.text,
            value: button.value
          });
    		},
    		handle_action_text: function () {
    			if(!this.action.text.value) return;
          _handleAction(this.action.text.value);
    			_actionResolve({
            type: 'text',
            value: this.action.text.value
          });
    			this.action.text.value = '';
    		}
    	}
    };

    root.Vue.directive('botui-markdown', function (el, binding) {
      if(binding.value == 'false') return;
      el.innerHTML = _parseMarkDown(el.textContent);
    });

    root.Vue.directive('botui-scroll', {
      inserted: function (el) {
        el.scrollIntoView();
      }
    });

    _botApp = new root.Vue({
      components: {
        'bot-ui': _botuiComponent
      }
    }).$mount('#' + id);

    var _instance = _botApp.$children[0]; // to access the component's data

    function _addMessage(_msg) {

      if(!_msg.content) {
        throw Error('BotUI: "content" is required in message object.');
      }

      _msg.type = _msg.type || 'text';
      _msg.visible = _msg.delay ? false : true;
      var _index = _instance.messages.push(_msg) - 1;

      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          _instance.messages[_index].visible = true;
          resolve(_index);
        }, _msg.delay || 0);
      });
    }

    _interface.message =  {
      add: function (addOpts) {
        return _addMessage(addOpts);
      },
      bot: function (addOpts) {
        addOpts = addOpts || {};
        return _addMessage(addOpts);
      },
      human: function (addOpts) {
        addOpts = addOpts || {};
        addOpts.human = true;
        return _addMessage(addOpts);
      },
      get: function (index) {
        return Promise.resolve(_instance.messages[index]);
      },
      remove: function (index) {
        _instance.messages.splice(index, 1);
        return Promise.resolve();
      },
      update: function (index, msg) { // only content can be updated, not the message type.
        _instance.messages[index].content = msg.content;
        return Promise.resolve(msg.content);
      },
      removeAll: function () {
        _instance.messages.splice(0, _instance.messages.length);
        return Promise.resolve();
      }
    };

    function mergeAtoB(objA, objB) {
      for (var prop in objA) {
        if (!objB.hasOwnProperty(prop)) {
          objB[prop] = objA[prop];
        }
      }
    }

    var _showActions = function (_opts) {

      mergeAtoB({
        type: 'text',
        cssClass: '',
        autoHide: true,
        addMessage: true
      }, _opts);

      _instance.action.type = _opts.type;
      _instance.action.cssClass = _opts.cssClass;
      _instance.action.autoHide = _opts.autoHide;
      _instance.action.addMessage = _opts.addMessage;

      return new Promise(function(resolve, reject) {
        _actionResolve = resolve;
        setTimeout(function () {
          _instance.action.show = true;
          if(_opts.type == 'text') {
            Vue.nextTick(function () {
              _instance.$refs.input.focus();
            });
          }
        }, _opts.delay || 0);
      });
    };

    _interface.action = {
      show: _showActions,
      hide: function () {
        _instance.action.show = false;
        return Promise.resolve();
      },
      text: function (_opts) {
        _instance.action.text = _opts;
        return _showActions(_opts);
      },
      button: function (_opts) {
        _opts.type = 'button';

        if(!_opts.buttons) {
          throw Error('BotUI: "buttons" property is expected as an array.');
        }

        _instance.action.button.buttons = _opts.buttons;
        return _showActions(_opts);
      }
    };

    if(_options.fontawesome) {
      loadScript(_fontAwesome);
    }

    if(_options.debug) {
      _interface._botApp = _botApp; // current Vue instance
    }

    return _interface;
  });

  return BotUI;

}));
