(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/react/cjs/react.production.min.js
  var require_react_production_min = __commonJS({
    "node_modules/react/cjs/react.production.min.js"(exports) {
      "use strict";
      var l = Symbol.for("react.element");
      var n = Symbol.for("react.portal");
      var p = Symbol.for("react.fragment");
      var q = Symbol.for("react.strict_mode");
      var r = Symbol.for("react.profiler");
      var t = Symbol.for("react.provider");
      var u = Symbol.for("react.context");
      var v = Symbol.for("react.forward_ref");
      var w = Symbol.for("react.suspense");
      var x = Symbol.for("react.memo");
      var y = Symbol.for("react.lazy");
      var z = Symbol.iterator;
      function A(a) {
        if (null === a || "object" !== typeof a) return null;
        a = z && a[z] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var B = { isMounted: function() {
        return false;
      }, enqueueForceUpdate: function() {
      }, enqueueReplaceState: function() {
      }, enqueueSetState: function() {
      } };
      var C = Object.assign;
      var D = {};
      function E(a, b, e3) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e3 || B;
      }
      E.prototype.isReactComponent = {};
      E.prototype.setState = function(a, b) {
        if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, a, b, "setState");
      };
      E.prototype.forceUpdate = function(a) {
        this.updater.enqueueForceUpdate(this, a, "forceUpdate");
      };
      function F() {
      }
      F.prototype = E.prototype;
      function G(a, b, e3) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e3 || B;
      }
      var H = G.prototype = new F();
      H.constructor = G;
      C(H, E.prototype);
      H.isPureReactComponent = true;
      var I = Array.isArray;
      var J = Object.prototype.hasOwnProperty;
      var K = { current: null };
      var L = { key: true, ref: true, __self: true, __source: true };
      function M(a, b, e3) {
        var d, c = {}, k = null, h = null;
        if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
        var g = arguments.length - 2;
        if (1 === g) c.children = e3;
        else if (1 < g) {
          for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
          c.children = f;
        }
        if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
        return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
      }
      function N(a, b) {
        return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
      }
      function O(a) {
        return "object" === typeof a && null !== a && a.$$typeof === l;
      }
      function escape(a) {
        var b = { "=": "=0", ":": "=2" };
        return "$" + a.replace(/[=:]/g, function(a2) {
          return b[a2];
        });
      }
      var P = /\/+/g;
      function Q(a, b) {
        return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
      }
      function R(a, b, e3, d, c) {
        var k = typeof a;
        if ("undefined" === k || "boolean" === k) a = null;
        var h = false;
        if (null === a) h = true;
        else switch (k) {
          case "string":
          case "number":
            h = true;
            break;
          case "object":
            switch (a.$$typeof) {
              case l:
              case n:
                h = true;
            }
        }
        if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e3 = "", null != a && (e3 = a.replace(P, "$&/") + "/"), R(c, b, e3, "", function(a2) {
          return a2;
        })) : null != c && (O(c) && (c = N(c, e3 + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
        h = 0;
        d = "" === d ? "." : d + ":";
        if (I(a)) for (var g = 0; g < a.length; g++) {
          k = a[g];
          var f = d + Q(k, g);
          h += R(k, b, e3, f, c);
        }
        else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e3, f, c);
        else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
        return h;
      }
      function S(a, b, e3) {
        if (null == a) return a;
        var d = [], c = 0;
        R(a, d, "", "", function(a2) {
          return b.call(e3, a2, c++);
        });
        return d;
      }
      function T(a) {
        if (-1 === a._status) {
          var b = a._result;
          b = b();
          b.then(function(b2) {
            if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
          }, function(b2) {
            if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
          });
          -1 === a._status && (a._status = 0, a._result = b);
        }
        if (1 === a._status) return a._result.default;
        throw a._result;
      }
      var U = { current: null };
      var V = { transition: null };
      var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
      function X() {
        throw Error("act(...) is not supported in production builds of React.");
      }
      exports.Children = { map: S, forEach: function(a, b, e3) {
        S(a, function() {
          b.apply(this, arguments);
        }, e3);
      }, count: function(a) {
        var b = 0;
        S(a, function() {
          b++;
        });
        return b;
      }, toArray: function(a) {
        return S(a, function(a2) {
          return a2;
        }) || [];
      }, only: function(a) {
        if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
        return a;
      } };
      exports.Component = E;
      exports.Fragment = p;
      exports.Profiler = r;
      exports.PureComponent = G;
      exports.StrictMode = q;
      exports.Suspense = w;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
      exports.act = X;
      exports.cloneElement = function(a, b, e3) {
        if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
        var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
        if (null != b) {
          void 0 !== b.ref && (k = b.ref, h = K.current);
          void 0 !== b.key && (c = "" + b.key);
          if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
          for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
        }
        var f = arguments.length - 2;
        if (1 === f) d.children = e3;
        else if (1 < f) {
          g = Array(f);
          for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
          d.children = g;
        }
        return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
      };
      exports.createContext = function(a) {
        a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
        a.Provider = { $$typeof: t, _context: a };
        return a.Consumer = a;
      };
      exports.createElement = M;
      exports.createFactory = function(a) {
        var b = M.bind(null, a);
        b.type = a;
        return b;
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(a) {
        return { $$typeof: v, render: a };
      };
      exports.isValidElement = O;
      exports.lazy = function(a) {
        return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
      };
      exports.memo = function(a, b) {
        return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
      };
      exports.startTransition = function(a) {
        var b = V.transition;
        V.transition = {};
        try {
          a();
        } finally {
          V.transition = b;
        }
      };
      exports.unstable_act = X;
      exports.useCallback = function(a, b) {
        return U.current.useCallback(a, b);
      };
      exports.useContext = function(a) {
        return U.current.useContext(a);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(a) {
        return U.current.useDeferredValue(a);
      };
      exports.useEffect = function(a, b) {
        return U.current.useEffect(a, b);
      };
      exports.useId = function() {
        return U.current.useId();
      };
      exports.useImperativeHandle = function(a, b, e3) {
        return U.current.useImperativeHandle(a, b, e3);
      };
      exports.useInsertionEffect = function(a, b) {
        return U.current.useInsertionEffect(a, b);
      };
      exports.useLayoutEffect = function(a, b) {
        return U.current.useLayoutEffect(a, b);
      };
      exports.useMemo = function(a, b) {
        return U.current.useMemo(a, b);
      };
      exports.useReducer = function(a, b, e3) {
        return U.current.useReducer(a, b, e3);
      };
      exports.useRef = function(a) {
        return U.current.useRef(a);
      };
      exports.useState = function(a) {
        return U.current.useState(a);
      };
      exports.useSyncExternalStore = function(a, b, e3) {
        return U.current.useSyncExternalStore(a, b, e3);
      };
      exports.useTransition = function() {
        return U.current.useTransition();
      };
      exports.version = "18.3.1";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.min.js
  var require_scheduler_production_min = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.min.js"(exports) {
      "use strict";
      function f(a, b) {
        var c = a.length;
        a.push(b);
        a: for (; 0 < c; ) {
          var d = c - 1 >>> 1, e3 = a[d];
          if (0 < g(e3, b)) a[d] = b, a[c] = e3, c = d;
          else break a;
        }
      }
      function h(a) {
        return 0 === a.length ? null : a[0];
      }
      function k(a) {
        if (0 === a.length) return null;
        var b = a[0], c = a.pop();
        if (c !== b) {
          a[0] = c;
          a: for (var d = 0, e3 = a.length, w = e3 >>> 1; d < w; ) {
            var m = 2 * (d + 1) - 1, C = a[m], n = m + 1, x = a[n];
            if (0 > g(C, c)) n < e3 && 0 > g(x, C) ? (a[d] = x, a[n] = c, d = n) : (a[d] = C, a[m] = c, d = m);
            else if (n < e3 && 0 > g(x, c)) a[d] = x, a[n] = c, d = n;
            else break a;
          }
        }
        return b;
      }
      function g(a, b) {
        var c = a.sortIndex - b.sortIndex;
        return 0 !== c ? c : a.id - b.id;
      }
      if ("object" === typeof performance && "function" === typeof performance.now) {
        l = performance;
        exports.unstable_now = function() {
          return l.now();
        };
      } else {
        p = Date, q = p.now();
        exports.unstable_now = function() {
          return p.now() - q;
        };
      }
      var l;
      var p;
      var q;
      var r = [];
      var t = [];
      var u = 1;
      var v = null;
      var y = 3;
      var z = false;
      var A = false;
      var B = false;
      var D = "function" === typeof setTimeout ? setTimeout : null;
      var E = "function" === typeof clearTimeout ? clearTimeout : null;
      var F = "undefined" !== typeof setImmediate ? setImmediate : null;
      "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
      function G(a) {
        for (var b = h(t); null !== b; ) {
          if (null === b.callback) k(t);
          else if (b.startTime <= a) k(t), b.sortIndex = b.expirationTime, f(r, b);
          else break;
          b = h(t);
        }
      }
      function H(a) {
        B = false;
        G(a);
        if (!A) if (null !== h(r)) A = true, I(J);
        else {
          var b = h(t);
          null !== b && K(H, b.startTime - a);
        }
      }
      function J(a, b) {
        A = false;
        B && (B = false, E(L), L = -1);
        z = true;
        var c = y;
        try {
          G(b);
          for (v = h(r); null !== v && (!(v.expirationTime > b) || a && !M()); ) {
            var d = v.callback;
            if ("function" === typeof d) {
              v.callback = null;
              y = v.priorityLevel;
              var e3 = d(v.expirationTime <= b);
              b = exports.unstable_now();
              "function" === typeof e3 ? v.callback = e3 : v === h(r) && k(r);
              G(b);
            } else k(r);
            v = h(r);
          }
          if (null !== v) var w = true;
          else {
            var m = h(t);
            null !== m && K(H, m.startTime - b);
            w = false;
          }
          return w;
        } finally {
          v = null, y = c, z = false;
        }
      }
      var N = false;
      var O = null;
      var L = -1;
      var P = 5;
      var Q = -1;
      function M() {
        return exports.unstable_now() - Q < P ? false : true;
      }
      function R() {
        if (null !== O) {
          var a = exports.unstable_now();
          Q = a;
          var b = true;
          try {
            b = O(true, a);
          } finally {
            b ? S() : (N = false, O = null);
          }
        } else N = false;
      }
      var S;
      if ("function" === typeof F) S = function() {
        F(R);
      };
      else if ("undefined" !== typeof MessageChannel) {
        T = new MessageChannel(), U = T.port2;
        T.port1.onmessage = R;
        S = function() {
          U.postMessage(null);
        };
      } else S = function() {
        D(R, 0);
      };
      var T;
      var U;
      function I(a) {
        O = a;
        N || (N = true, S());
      }
      function K(a, b) {
        L = D(function() {
          a(exports.unstable_now());
        }, b);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(a) {
        a.callback = null;
      };
      exports.unstable_continueExecution = function() {
        A || z || (A = true, I(J));
      };
      exports.unstable_forceFrameRate = function(a) {
        0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a ? Math.floor(1e3 / a) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return y;
      };
      exports.unstable_getFirstCallbackNode = function() {
        return h(r);
      };
      exports.unstable_next = function(a) {
        switch (y) {
          case 1:
          case 2:
          case 3:
            var b = 3;
            break;
          default:
            b = y;
        }
        var c = y;
        y = b;
        try {
          return a();
        } finally {
          y = c;
        }
      };
      exports.unstable_pauseExecution = function() {
      };
      exports.unstable_requestPaint = function() {
      };
      exports.unstable_runWithPriority = function(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            a = 3;
        }
        var c = y;
        y = a;
        try {
          return b();
        } finally {
          y = c;
        }
      };
      exports.unstable_scheduleCallback = function(a, b, c) {
        var d = exports.unstable_now();
        "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
        switch (a) {
          case 1:
            var e3 = -1;
            break;
          case 2:
            e3 = 250;
            break;
          case 5:
            e3 = 1073741823;
            break;
          case 4:
            e3 = 1e4;
            break;
          default:
            e3 = 5e3;
        }
        e3 = c + e3;
        a = { id: u++, callback: b, priorityLevel: a, startTime: c, expirationTime: e3, sortIndex: -1 };
        c > d ? (a.sortIndex = c, f(t, a), null === h(r) && a === h(t) && (B ? (E(L), L = -1) : B = true, K(H, c - d))) : (a.sortIndex = e3, f(r, a), A || z || (A = true, I(J)));
        return a;
      };
      exports.unstable_shouldYield = M;
      exports.unstable_wrapCallback = function(a) {
        var b = y;
        return function() {
          var c = y;
          y = b;
          try {
            return a.apply(this, arguments);
          } finally {
            y = c;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_scheduler_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.min.js
  var require_react_dom_production_min = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.min.js"(exports) {
      "use strict";
      var aa = require_react();
      var ca = require_scheduler();
      function p(a) {
        for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
        return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      var da = /* @__PURE__ */ new Set();
      var ea = {};
      function fa(a, b) {
        ha(a, b);
        ha(a + "Capture", b);
      }
      function ha(a, b) {
        ea[a] = b;
        for (a = 0; a < b.length; a++) da.add(b[a]);
      }
      var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var ja = Object.prototype.hasOwnProperty;
      var ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
      var la = {};
      var ma = {};
      function oa(a) {
        if (ja.call(ma, a)) return true;
        if (ja.call(la, a)) return false;
        if (ka.test(a)) return ma[a] = true;
        la[a] = true;
        return false;
      }
      function pa(a, b, c, d) {
        if (null !== c && 0 === c.type) return false;
        switch (typeof b) {
          case "function":
          case "symbol":
            return true;
          case "boolean":
            if (d) return false;
            if (null !== c) return !c.acceptsBooleans;
            a = a.toLowerCase().slice(0, 5);
            return "data-" !== a && "aria-" !== a;
          default:
            return false;
        }
      }
      function qa(a, b, c, d) {
        if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
        if (d) return false;
        if (null !== c) switch (c.type) {
          case 3:
            return !b;
          case 4:
            return false === b;
          case 5:
            return isNaN(b);
          case 6:
            return isNaN(b) || 1 > b;
        }
        return false;
      }
      function v(a, b, c, d, e3, f, g) {
        this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
        this.attributeName = d;
        this.attributeNamespace = e3;
        this.mustUseProperty = c;
        this.propertyName = a;
        this.type = b;
        this.sanitizeURL = f;
        this.removeEmptyString = g;
      }
      var z = {};
      "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
        z[a] = new v(a, 0, false, a, null, false, false);
      });
      [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
        var b = a[0];
        z[b] = new v(b, 1, false, a[1], null, false, false);
      });
      ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
        z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
      });
      ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
        z[a] = new v(a, 2, false, a, null, false, false);
      });
      "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
        z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
      });
      ["checked", "multiple", "muted", "selected"].forEach(function(a) {
        z[a] = new v(a, 3, true, a, null, false, false);
      });
      ["capture", "download"].forEach(function(a) {
        z[a] = new v(a, 4, false, a, null, false, false);
      });
      ["cols", "rows", "size", "span"].forEach(function(a) {
        z[a] = new v(a, 6, false, a, null, false, false);
      });
      ["rowSpan", "start"].forEach(function(a) {
        z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
      });
      var ra = /[\-:]([a-z])/g;
      function sa(a) {
        return a[1].toUpperCase();
      }
      "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
        var b = a.replace(
          ra,
          sa
        );
        z[b] = new v(b, 1, false, a, null, false, false);
      });
      "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
      });
      ["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
      });
      ["tabIndex", "crossOrigin"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
      });
      z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
      ["src", "href", "action", "formAction"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
      });
      function ta(a, b, c, d) {
        var e3 = z.hasOwnProperty(b) ? z[b] : null;
        if (null !== e3 ? 0 !== e3.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e3, d) && (c = null), d || null === e3 ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e3.mustUseProperty ? a[e3.propertyName] = null === c ? 3 === e3.type ? false : "" : c : (b = e3.attributeName, d = e3.attributeNamespace, null === c ? a.removeAttribute(b) : (e3 = e3.type, c = 3 === e3 || 4 === e3 && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
      }
      var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      var va = Symbol.for("react.element");
      var wa = Symbol.for("react.portal");
      var ya = Symbol.for("react.fragment");
      var za = Symbol.for("react.strict_mode");
      var Aa = Symbol.for("react.profiler");
      var Ba = Symbol.for("react.provider");
      var Ca = Symbol.for("react.context");
      var Da = Symbol.for("react.forward_ref");
      var Ea = Symbol.for("react.suspense");
      var Fa = Symbol.for("react.suspense_list");
      var Ga = Symbol.for("react.memo");
      var Ha = Symbol.for("react.lazy");
      Symbol.for("react.scope");
      Symbol.for("react.debug_trace_mode");
      var Ia = Symbol.for("react.offscreen");
      Symbol.for("react.legacy_hidden");
      Symbol.for("react.cache");
      Symbol.for("react.tracing_marker");
      var Ja = Symbol.iterator;
      function Ka(a) {
        if (null === a || "object" !== typeof a) return null;
        a = Ja && a[Ja] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var A = Object.assign;
      var La;
      function Ma(a) {
        if (void 0 === La) try {
          throw Error();
        } catch (c) {
          var b = c.stack.trim().match(/\n( *(at )?)/);
          La = b && b[1] || "";
        }
        return "\n" + La + a;
      }
      var Na = false;
      function Oa(a, b) {
        if (!a || Na) return "";
        Na = true;
        var c = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          if (b) if (b = function() {
            throw Error();
          }, Object.defineProperty(b.prototype, "props", { set: function() {
            throw Error();
          } }), "object" === typeof Reflect && Reflect.construct) {
            try {
              Reflect.construct(b, []);
            } catch (l) {
              var d = l;
            }
            Reflect.construct(a, [], b);
          } else {
            try {
              b.call();
            } catch (l) {
              d = l;
            }
            a.call(b.prototype);
          }
          else {
            try {
              throw Error();
            } catch (l) {
              d = l;
            }
            a();
          }
        } catch (l) {
          if (l && d && "string" === typeof l.stack) {
            for (var e3 = l.stack.split("\n"), f = d.stack.split("\n"), g = e3.length - 1, h = f.length - 1; 1 <= g && 0 <= h && e3[g] !== f[h]; ) h--;
            for (; 1 <= g && 0 <= h; g--, h--) if (e3[g] !== f[h]) {
              if (1 !== g || 1 !== h) {
                do
                  if (g--, h--, 0 > h || e3[g] !== f[h]) {
                    var k = "\n" + e3[g].replace(" at new ", " at ");
                    a.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a.displayName));
                    return k;
                  }
                while (1 <= g && 0 <= h);
              }
              break;
            }
          }
        } finally {
          Na = false, Error.prepareStackTrace = c;
        }
        return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
      }
      function Pa(a) {
        switch (a.tag) {
          case 5:
            return Ma(a.type);
          case 16:
            return Ma("Lazy");
          case 13:
            return Ma("Suspense");
          case 19:
            return Ma("SuspenseList");
          case 0:
          case 2:
          case 15:
            return a = Oa(a.type, false), a;
          case 11:
            return a = Oa(a.type.render, false), a;
          case 1:
            return a = Oa(a.type, true), a;
          default:
            return "";
        }
      }
      function Qa(a) {
        if (null == a) return null;
        if ("function" === typeof a) return a.displayName || a.name || null;
        if ("string" === typeof a) return a;
        switch (a) {
          case ya:
            return "Fragment";
          case wa:
            return "Portal";
          case Aa:
            return "Profiler";
          case za:
            return "StrictMode";
          case Ea:
            return "Suspense";
          case Fa:
            return "SuspenseList";
        }
        if ("object" === typeof a) switch (a.$$typeof) {
          case Ca:
            return (a.displayName || "Context") + ".Consumer";
          case Ba:
            return (a._context.displayName || "Context") + ".Provider";
          case Da:
            var b = a.render;
            a = a.displayName;
            a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
            return a;
          case Ga:
            return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
          case Ha:
            b = a._payload;
            a = a._init;
            try {
              return Qa(a(b));
            } catch (c) {
            }
        }
        return null;
      }
      function Ra(a) {
        var b = a.type;
        switch (a.tag) {
          case 24:
            return "Cache";
          case 9:
            return (b.displayName || "Context") + ".Consumer";
          case 10:
            return (b._context.displayName || "Context") + ".Provider";
          case 18:
            return "DehydratedFragment";
          case 11:
            return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
          case 7:
            return "Fragment";
          case 5:
            return b;
          case 4:
            return "Portal";
          case 3:
            return "Root";
          case 6:
            return "Text";
          case 16:
            return Qa(b);
          case 8:
            return b === za ? "StrictMode" : "Mode";
          case 22:
            return "Offscreen";
          case 12:
            return "Profiler";
          case 21:
            return "Scope";
          case 13:
            return "Suspense";
          case 19:
            return "SuspenseList";
          case 25:
            return "TracingMarker";
          case 1:
          case 0:
          case 17:
          case 2:
          case 14:
          case 15:
            if ("function" === typeof b) return b.displayName || b.name || null;
            if ("string" === typeof b) return b;
        }
        return null;
      }
      function Sa(a) {
        switch (typeof a) {
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return a;
          case "object":
            return a;
          default:
            return "";
        }
      }
      function Ta(a) {
        var b = a.type;
        return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
      }
      function Ua(a) {
        var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
        if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
          var e3 = c.get, f = c.set;
          Object.defineProperty(a, b, { configurable: true, get: function() {
            return e3.call(this);
          }, set: function(a2) {
            d = "" + a2;
            f.call(this, a2);
          } });
          Object.defineProperty(a, b, { enumerable: c.enumerable });
          return { getValue: function() {
            return d;
          }, setValue: function(a2) {
            d = "" + a2;
          }, stopTracking: function() {
            a._valueTracker = null;
            delete a[b];
          } };
        }
      }
      function Va(a) {
        a._valueTracker || (a._valueTracker = Ua(a));
      }
      function Wa(a) {
        if (!a) return false;
        var b = a._valueTracker;
        if (!b) return true;
        var c = b.getValue();
        var d = "";
        a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
        a = d;
        return a !== c ? (b.setValue(a), true) : false;
      }
      function Xa(a) {
        a = a || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof a) return null;
        try {
          return a.activeElement || a.body;
        } catch (b) {
          return a.body;
        }
      }
      function Ya(a, b) {
        var c = b.checked;
        return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
      }
      function Za(a, b) {
        var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
        c = Sa(null != b.value ? b.value : c);
        a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
      }
      function ab(a, b) {
        b = b.checked;
        null != b && ta(a, "checked", b, false);
      }
      function bb(a, b) {
        ab(a, b);
        var c = Sa(b.value), d = b.type;
        if (null != c) if ("number" === d) {
          if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
        } else a.value !== "" + c && (a.value = "" + c);
        else if ("submit" === d || "reset" === d) {
          a.removeAttribute("value");
          return;
        }
        b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
        null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
      }
      function db(a, b, c) {
        if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
          var d = b.type;
          if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
          b = "" + a._wrapperState.initialValue;
          c || b === a.value || (a.value = b);
          a.defaultValue = b;
        }
        c = a.name;
        "" !== c && (a.name = "");
        a.defaultChecked = !!a._wrapperState.initialChecked;
        "" !== c && (a.name = c);
      }
      function cb(a, b, c) {
        if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
      }
      var eb = Array.isArray;
      function fb(a, b, c, d) {
        a = a.options;
        if (b) {
          b = {};
          for (var e3 = 0; e3 < c.length; e3++) b["$" + c[e3]] = true;
          for (c = 0; c < a.length; c++) e3 = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e3 && (a[c].selected = e3), e3 && d && (a[c].defaultSelected = true);
        } else {
          c = "" + Sa(c);
          b = null;
          for (e3 = 0; e3 < a.length; e3++) {
            if (a[e3].value === c) {
              a[e3].selected = true;
              d && (a[e3].defaultSelected = true);
              return;
            }
            null !== b || a[e3].disabled || (b = a[e3]);
          }
          null !== b && (b.selected = true);
        }
      }
      function gb(a, b) {
        if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
        return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
      }
      function hb(a, b) {
        var c = b.value;
        if (null == c) {
          c = b.children;
          b = b.defaultValue;
          if (null != c) {
            if (null != b) throw Error(p(92));
            if (eb(c)) {
              if (1 < c.length) throw Error(p(93));
              c = c[0];
            }
            b = c;
          }
          null == b && (b = "");
          c = b;
        }
        a._wrapperState = { initialValue: Sa(c) };
      }
      function ib(a, b) {
        var c = Sa(b.value), d = Sa(b.defaultValue);
        null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
        null != d && (a.defaultValue = "" + d);
      }
      function jb(a) {
        var b = a.textContent;
        b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
      }
      function kb(a) {
        switch (a) {
          case "svg":
            return "http://www.w3.org/2000/svg";
          case "math":
            return "http://www.w3.org/1998/Math/MathML";
          default:
            return "http://www.w3.org/1999/xhtml";
        }
      }
      function lb(a, b) {
        return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
      }
      var mb;
      var nb = function(a) {
        return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e3) {
          MSApp.execUnsafeLocalFunction(function() {
            return a(b, c, d, e3);
          });
        } : a;
      }(function(a, b) {
        if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
        else {
          mb = mb || document.createElement("div");
          mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
          for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
          for (; b.firstChild; ) a.appendChild(b.firstChild);
        }
      });
      function ob(a, b) {
        if (b) {
          var c = a.firstChild;
          if (c && c === a.lastChild && 3 === c.nodeType) {
            c.nodeValue = b;
            return;
          }
        }
        a.textContent = b;
      }
      var pb = {
        animationIterationCount: true,
        aspectRatio: true,
        borderImageOutset: true,
        borderImageSlice: true,
        borderImageWidth: true,
        boxFlex: true,
        boxFlexGroup: true,
        boxOrdinalGroup: true,
        columnCount: true,
        columns: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        flexOrder: true,
        gridArea: true,
        gridRow: true,
        gridRowEnd: true,
        gridRowSpan: true,
        gridRowStart: true,
        gridColumn: true,
        gridColumnEnd: true,
        gridColumnSpan: true,
        gridColumnStart: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        tabSize: true,
        widows: true,
        zIndex: true,
        zoom: true,
        fillOpacity: true,
        floodOpacity: true,
        stopOpacity: true,
        strokeDasharray: true,
        strokeDashoffset: true,
        strokeMiterlimit: true,
        strokeOpacity: true,
        strokeWidth: true
      };
      var qb = ["Webkit", "ms", "Moz", "O"];
      Object.keys(pb).forEach(function(a) {
        qb.forEach(function(b) {
          b = b + a.charAt(0).toUpperCase() + a.substring(1);
          pb[b] = pb[a];
        });
      });
      function rb(a, b, c) {
        return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
      }
      function sb(a, b) {
        a = a.style;
        for (var c in b) if (b.hasOwnProperty(c)) {
          var d = 0 === c.indexOf("--"), e3 = rb(c, b[c], d);
          "float" === c && (c = "cssFloat");
          d ? a.setProperty(c, e3) : a[c] = e3;
        }
      }
      var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
      function ub(a, b) {
        if (b) {
          if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
          if (null != b.dangerouslySetInnerHTML) {
            if (null != b.children) throw Error(p(60));
            if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
          }
          if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
        }
      }
      function vb(a, b) {
        if (-1 === a.indexOf("-")) return "string" === typeof b.is;
        switch (a) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      var wb = null;
      function xb(a) {
        a = a.target || a.srcElement || window;
        a.correspondingUseElement && (a = a.correspondingUseElement);
        return 3 === a.nodeType ? a.parentNode : a;
      }
      var yb = null;
      var zb = null;
      var Ab = null;
      function Bb(a) {
        if (a = Cb(a)) {
          if ("function" !== typeof yb) throw Error(p(280));
          var b = a.stateNode;
          b && (b = Db(b), yb(a.stateNode, a.type, b));
        }
      }
      function Eb(a) {
        zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
      }
      function Fb() {
        if (zb) {
          var a = zb, b = Ab;
          Ab = zb = null;
          Bb(a);
          if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
        }
      }
      function Gb(a, b) {
        return a(b);
      }
      function Hb() {
      }
      var Ib = false;
      function Jb(a, b, c) {
        if (Ib) return a(b, c);
        Ib = true;
        try {
          return Gb(a, b, c);
        } finally {
          if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
        }
      }
      function Kb(a, b) {
        var c = a.stateNode;
        if (null === c) return null;
        var d = Db(c);
        if (null === d) return null;
        c = d[b];
        a: switch (b) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
            a = !d;
            break a;
          default:
            a = false;
        }
        if (a) return null;
        if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
        return c;
      }
      var Lb = false;
      if (ia) try {
        Mb = {};
        Object.defineProperty(Mb, "passive", { get: function() {
          Lb = true;
        } });
        window.addEventListener("test", Mb, Mb);
        window.removeEventListener("test", Mb, Mb);
      } catch (a) {
        Lb = false;
      }
      var Mb;
      function Nb(a, b, c, d, e3, f, g, h, k) {
        var l = Array.prototype.slice.call(arguments, 3);
        try {
          b.apply(c, l);
        } catch (m) {
          this.onError(m);
        }
      }
      var Ob = false;
      var Pb = null;
      var Qb = false;
      var Rb = null;
      var Sb = { onError: function(a) {
        Ob = true;
        Pb = a;
      } };
      function Tb(a, b, c, d, e3, f, g, h, k) {
        Ob = false;
        Pb = null;
        Nb.apply(Sb, arguments);
      }
      function Ub(a, b, c, d, e3, f, g, h, k) {
        Tb.apply(this, arguments);
        if (Ob) {
          if (Ob) {
            var l = Pb;
            Ob = false;
            Pb = null;
          } else throw Error(p(198));
          Qb || (Qb = true, Rb = l);
        }
      }
      function Vb(a) {
        var b = a, c = a;
        if (a.alternate) for (; b.return; ) b = b.return;
        else {
          a = b;
          do
            b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
          while (a);
        }
        return 3 === b.tag ? c : null;
      }
      function Wb(a) {
        if (13 === a.tag) {
          var b = a.memoizedState;
          null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
          if (null !== b) return b.dehydrated;
        }
        return null;
      }
      function Xb(a) {
        if (Vb(a) !== a) throw Error(p(188));
      }
      function Yb(a) {
        var b = a.alternate;
        if (!b) {
          b = Vb(a);
          if (null === b) throw Error(p(188));
          return b !== a ? null : a;
        }
        for (var c = a, d = b; ; ) {
          var e3 = c.return;
          if (null === e3) break;
          var f = e3.alternate;
          if (null === f) {
            d = e3.return;
            if (null !== d) {
              c = d;
              continue;
            }
            break;
          }
          if (e3.child === f.child) {
            for (f = e3.child; f; ) {
              if (f === c) return Xb(e3), a;
              if (f === d) return Xb(e3), b;
              f = f.sibling;
            }
            throw Error(p(188));
          }
          if (c.return !== d.return) c = e3, d = f;
          else {
            for (var g = false, h = e3.child; h; ) {
              if (h === c) {
                g = true;
                c = e3;
                d = f;
                break;
              }
              if (h === d) {
                g = true;
                d = e3;
                c = f;
                break;
              }
              h = h.sibling;
            }
            if (!g) {
              for (h = f.child; h; ) {
                if (h === c) {
                  g = true;
                  c = f;
                  d = e3;
                  break;
                }
                if (h === d) {
                  g = true;
                  d = f;
                  c = e3;
                  break;
                }
                h = h.sibling;
              }
              if (!g) throw Error(p(189));
            }
          }
          if (c.alternate !== d) throw Error(p(190));
        }
        if (3 !== c.tag) throw Error(p(188));
        return c.stateNode.current === c ? a : b;
      }
      function Zb(a) {
        a = Yb(a);
        return null !== a ? $b(a) : null;
      }
      function $b(a) {
        if (5 === a.tag || 6 === a.tag) return a;
        for (a = a.child; null !== a; ) {
          var b = $b(a);
          if (null !== b) return b;
          a = a.sibling;
        }
        return null;
      }
      var ac = ca.unstable_scheduleCallback;
      var bc = ca.unstable_cancelCallback;
      var cc = ca.unstable_shouldYield;
      var dc = ca.unstable_requestPaint;
      var B = ca.unstable_now;
      var ec = ca.unstable_getCurrentPriorityLevel;
      var fc = ca.unstable_ImmediatePriority;
      var gc = ca.unstable_UserBlockingPriority;
      var hc = ca.unstable_NormalPriority;
      var ic = ca.unstable_LowPriority;
      var jc = ca.unstable_IdlePriority;
      var kc = null;
      var lc = null;
      function mc(a) {
        if (lc && "function" === typeof lc.onCommitFiberRoot) try {
          lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
        } catch (b) {
        }
      }
      var oc = Math.clz32 ? Math.clz32 : nc;
      var pc = Math.log;
      var qc = Math.LN2;
      function nc(a) {
        a >>>= 0;
        return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
      }
      var rc = 64;
      var sc = 4194304;
      function tc(a) {
        switch (a & -a) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return a & 4194240;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return a & 130023424;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 1073741824;
          default:
            return a;
        }
      }
      function uc(a, b) {
        var c = a.pendingLanes;
        if (0 === c) return 0;
        var d = 0, e3 = a.suspendedLanes, f = a.pingedLanes, g = c & 268435455;
        if (0 !== g) {
          var h = g & ~e3;
          0 !== h ? d = tc(h) : (f &= g, 0 !== f && (d = tc(f)));
        } else g = c & ~e3, 0 !== g ? d = tc(g) : 0 !== f && (d = tc(f));
        if (0 === d) return 0;
        if (0 !== b && b !== d && 0 === (b & e3) && (e3 = d & -d, f = b & -b, e3 >= f || 16 === e3 && 0 !== (f & 4194240))) return b;
        0 !== (d & 4) && (d |= c & 16);
        b = a.entangledLanes;
        if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e3 = 1 << c, d |= a[c], b &= ~e3;
        return d;
      }
      function vc(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 4:
            return b + 250;
          case 8:
          case 16:
          case 32:
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return b + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return -1;
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function wc(a, b) {
        for (var c = a.suspendedLanes, d = a.pingedLanes, e3 = a.expirationTimes, f = a.pendingLanes; 0 < f; ) {
          var g = 31 - oc(f), h = 1 << g, k = e3[g];
          if (-1 === k) {
            if (0 === (h & c) || 0 !== (h & d)) e3[g] = vc(h, b);
          } else k <= b && (a.expiredLanes |= h);
          f &= ~h;
        }
      }
      function xc(a) {
        a = a.pendingLanes & -1073741825;
        return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
      }
      function yc() {
        var a = rc;
        rc <<= 1;
        0 === (rc & 4194240) && (rc = 64);
        return a;
      }
      function zc(a) {
        for (var b = [], c = 0; 31 > c; c++) b.push(a);
        return b;
      }
      function Ac(a, b, c) {
        a.pendingLanes |= b;
        536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
        a = a.eventTimes;
        b = 31 - oc(b);
        a[b] = c;
      }
      function Bc(a, b) {
        var c = a.pendingLanes & ~b;
        a.pendingLanes = b;
        a.suspendedLanes = 0;
        a.pingedLanes = 0;
        a.expiredLanes &= b;
        a.mutableReadLanes &= b;
        a.entangledLanes &= b;
        b = a.entanglements;
        var d = a.eventTimes;
        for (a = a.expirationTimes; 0 < c; ) {
          var e3 = 31 - oc(c), f = 1 << e3;
          b[e3] = 0;
          d[e3] = -1;
          a[e3] = -1;
          c &= ~f;
        }
      }
      function Cc(a, b) {
        var c = a.entangledLanes |= b;
        for (a = a.entanglements; c; ) {
          var d = 31 - oc(c), e3 = 1 << d;
          e3 & b | a[d] & b && (a[d] |= b);
          c &= ~e3;
        }
      }
      var C = 0;
      function Dc(a) {
        a &= -a;
        return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
      }
      var Ec;
      var Fc;
      var Gc;
      var Hc;
      var Ic;
      var Jc = false;
      var Kc = [];
      var Lc = null;
      var Mc = null;
      var Nc = null;
      var Oc = /* @__PURE__ */ new Map();
      var Pc = /* @__PURE__ */ new Map();
      var Qc = [];
      var Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
      function Sc(a, b) {
        switch (a) {
          case "focusin":
          case "focusout":
            Lc = null;
            break;
          case "dragenter":
          case "dragleave":
            Mc = null;
            break;
          case "mouseover":
          case "mouseout":
            Nc = null;
            break;
          case "pointerover":
          case "pointerout":
            Oc.delete(b.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            Pc.delete(b.pointerId);
        }
      }
      function Tc(a, b, c, d, e3, f) {
        if (null === a || a.nativeEvent !== f) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f, targetContainers: [e3] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
        a.eventSystemFlags |= d;
        b = a.targetContainers;
        null !== e3 && -1 === b.indexOf(e3) && b.push(e3);
        return a;
      }
      function Uc(a, b, c, d, e3) {
        switch (b) {
          case "focusin":
            return Lc = Tc(Lc, a, b, c, d, e3), true;
          case "dragenter":
            return Mc = Tc(Mc, a, b, c, d, e3), true;
          case "mouseover":
            return Nc = Tc(Nc, a, b, c, d, e3), true;
          case "pointerover":
            var f = e3.pointerId;
            Oc.set(f, Tc(Oc.get(f) || null, a, b, c, d, e3));
            return true;
          case "gotpointercapture":
            return f = e3.pointerId, Pc.set(f, Tc(Pc.get(f) || null, a, b, c, d, e3)), true;
        }
        return false;
      }
      function Vc(a) {
        var b = Wc(a.target);
        if (null !== b) {
          var c = Vb(b);
          if (null !== c) {
            if (b = c.tag, 13 === b) {
              if (b = Wb(c), null !== b) {
                a.blockedOn = b;
                Ic(a.priority, function() {
                  Gc(c);
                });
                return;
              }
            } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
              a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
              return;
            }
          }
        }
        a.blockedOn = null;
      }
      function Xc(a) {
        if (null !== a.blockedOn) return false;
        for (var b = a.targetContainers; 0 < b.length; ) {
          var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
          if (null === c) {
            c = a.nativeEvent;
            var d = new c.constructor(c.type, c);
            wb = d;
            c.target.dispatchEvent(d);
            wb = null;
          } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
          b.shift();
        }
        return true;
      }
      function Zc(a, b, c) {
        Xc(a) && c.delete(b);
      }
      function $c() {
        Jc = false;
        null !== Lc && Xc(Lc) && (Lc = null);
        null !== Mc && Xc(Mc) && (Mc = null);
        null !== Nc && Xc(Nc) && (Nc = null);
        Oc.forEach(Zc);
        Pc.forEach(Zc);
      }
      function ad(a, b) {
        a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
      }
      function bd(a) {
        function b(b2) {
          return ad(b2, a);
        }
        if (0 < Kc.length) {
          ad(Kc[0], a);
          for (var c = 1; c < Kc.length; c++) {
            var d = Kc[c];
            d.blockedOn === a && (d.blockedOn = null);
          }
        }
        null !== Lc && ad(Lc, a);
        null !== Mc && ad(Mc, a);
        null !== Nc && ad(Nc, a);
        Oc.forEach(b);
        Pc.forEach(b);
        for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
        for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
      }
      var cd = ua.ReactCurrentBatchConfig;
      var dd = true;
      function ed(a, b, c, d) {
        var e3 = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 1, fd(a, b, c, d);
        } finally {
          C = e3, cd.transition = f;
        }
      }
      function gd(a, b, c, d) {
        var e3 = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 4, fd(a, b, c, d);
        } finally {
          C = e3, cd.transition = f;
        }
      }
      function fd(a, b, c, d) {
        if (dd) {
          var e3 = Yc(a, b, c, d);
          if (null === e3) hd(a, b, d, id, c), Sc(a, d);
          else if (Uc(e3, a, b, c, d)) d.stopPropagation();
          else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
            for (; null !== e3; ) {
              var f = Cb(e3);
              null !== f && Ec(f);
              f = Yc(a, b, c, d);
              null === f && hd(a, b, d, id, c);
              if (f === e3) break;
              e3 = f;
            }
            null !== e3 && d.stopPropagation();
          } else hd(a, b, d, null, c);
        }
      }
      var id = null;
      function Yc(a, b, c, d) {
        id = null;
        a = xb(d);
        a = Wc(a);
        if (null !== a) if (b = Vb(a), null === b) a = null;
        else if (c = b.tag, 13 === c) {
          a = Wb(b);
          if (null !== a) return a;
          a = null;
        } else if (3 === c) {
          if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
          a = null;
        } else b !== a && (a = null);
        id = a;
        return null;
      }
      function jd(a) {
        switch (a) {
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "resize":
          case "seeked":
          case "submit":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 1;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "scroll":
          case "toggle":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 4;
          case "message":
            switch (ec()) {
              case fc:
                return 1;
              case gc:
                return 4;
              case hc:
              case ic:
                return 16;
              case jc:
                return 536870912;
              default:
                return 16;
            }
          default:
            return 16;
        }
      }
      var kd = null;
      var ld = null;
      var md = null;
      function nd() {
        if (md) return md;
        var a, b = ld, c = b.length, d, e3 = "value" in kd ? kd.value : kd.textContent, f = e3.length;
        for (a = 0; a < c && b[a] === e3[a]; a++) ;
        var g = c - a;
        for (d = 1; d <= g && b[c - d] === e3[f - d]; d++) ;
        return md = e3.slice(a, 1 < d ? 1 - d : void 0);
      }
      function od(a) {
        var b = a.keyCode;
        "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
        10 === a && (a = 13);
        return 32 <= a || 13 === a ? a : 0;
      }
      function pd() {
        return true;
      }
      function qd() {
        return false;
      }
      function rd(a) {
        function b(b2, d, e3, f, g) {
          this._reactName = b2;
          this._targetInst = e3;
          this.type = d;
          this.nativeEvent = f;
          this.target = g;
          this.currentTarget = null;
          for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f) : f[c]);
          this.isDefaultPrevented = (null != f.defaultPrevented ? f.defaultPrevented : false === f.returnValue) ? pd : qd;
          this.isPropagationStopped = qd;
          return this;
        }
        A(b.prototype, { preventDefault: function() {
          this.defaultPrevented = true;
          var a2 = this.nativeEvent;
          a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
        }, stopPropagation: function() {
          var a2 = this.nativeEvent;
          a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
        }, persist: function() {
        }, isPersistent: pd });
        return b;
      }
      var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
        return a.timeStamp || Date.now();
      }, defaultPrevented: 0, isTrusted: 0 };
      var td = rd(sd);
      var ud = A({}, sd, { view: 0, detail: 0 });
      var vd = rd(ud);
      var wd;
      var xd;
      var yd;
      var Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
        return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
      }, movementX: function(a) {
        if ("movementX" in a) return a.movementX;
        a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
        return wd;
      }, movementY: function(a) {
        return "movementY" in a ? a.movementY : xd;
      } });
      var Bd = rd(Ad);
      var Cd = A({}, Ad, { dataTransfer: 0 });
      var Dd = rd(Cd);
      var Ed = A({}, ud, { relatedTarget: 0 });
      var Fd = rd(Ed);
      var Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Hd = rd(Gd);
      var Id = A({}, sd, { clipboardData: function(a) {
        return "clipboardData" in a ? a.clipboardData : window.clipboardData;
      } });
      var Jd = rd(Id);
      var Kd = A({}, sd, { data: 0 });
      var Ld = rd(Kd);
      var Md2 = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      };
      var Nd = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
      function Pd(a) {
        var b = this.nativeEvent;
        return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
      }
      function zd() {
        return Pd;
      }
      var Qd = A({}, ud, { key: function(a) {
        if (a.key) {
          var b = Md2[a.key] || a.key;
          if ("Unidentified" !== b) return b;
        }
        return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
      }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
        return "keypress" === a.type ? od(a) : 0;
      }, keyCode: function(a) {
        return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      }, which: function(a) {
        return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      } });
      var Rd = rd(Qd);
      var Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 });
      var Td = rd(Sd);
      var Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd });
      var Vd = rd(Ud);
      var Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Xd = rd(Wd);
      var Yd = A({}, Ad, {
        deltaX: function(a) {
          return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
        },
        deltaY: function(a) {
          return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      });
      var Zd = rd(Yd);
      var $d = [9, 13, 27, 32];
      var ae = ia && "CompositionEvent" in window;
      var be = null;
      ia && "documentMode" in document && (be = document.documentMode);
      var ce = ia && "TextEvent" in window && !be;
      var de = ia && (!ae || be && 8 < be && 11 >= be);
      var ee = String.fromCharCode(32);
      var fe = false;
      function ge(a, b) {
        switch (a) {
          case "keyup":
            return -1 !== $d.indexOf(b.keyCode);
          case "keydown":
            return 229 !== b.keyCode;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function he(a) {
        a = a.detail;
        return "object" === typeof a && "data" in a ? a.data : null;
      }
      var ie = false;
      function je(a, b) {
        switch (a) {
          case "compositionend":
            return he(b);
          case "keypress":
            if (32 !== b.which) return null;
            fe = true;
            return ee;
          case "textInput":
            return a = b.data, a === ee && fe ? null : a;
          default:
            return null;
        }
      }
      function ke(a, b) {
        if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
        switch (a) {
          case "paste":
            return null;
          case "keypress":
            if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
              if (b.char && 1 < b.char.length) return b.char;
              if (b.which) return String.fromCharCode(b.which);
            }
            return null;
          case "compositionend":
            return de && "ko" !== b.locale ? null : b.data;
          default:
            return null;
        }
      }
      var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
      function me(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
      }
      function ne(a, b, c, d) {
        Eb(d);
        b = oe(b, "onChange");
        0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
      }
      var pe = null;
      var qe = null;
      function re(a) {
        se(a, 0);
      }
      function te(a) {
        var b = ue(a);
        if (Wa(b)) return a;
      }
      function ve(a, b) {
        if ("change" === a) return b;
      }
      var we = false;
      if (ia) {
        if (ia) {
          ye = "oninput" in document;
          if (!ye) {
            ze = document.createElement("div");
            ze.setAttribute("oninput", "return;");
            ye = "function" === typeof ze.oninput;
          }
          xe = ye;
        } else xe = false;
        we = xe && (!document.documentMode || 9 < document.documentMode);
      }
      var xe;
      var ye;
      var ze;
      function Ae() {
        pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
      }
      function Be(a) {
        if ("value" === a.propertyName && te(qe)) {
          var b = [];
          ne(b, qe, a, xb(a));
          Jb(re, b);
        }
      }
      function Ce(a, b, c) {
        "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
      }
      function De(a) {
        if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
      }
      function Ee(a, b) {
        if ("click" === a) return te(b);
      }
      function Fe(a, b) {
        if ("input" === a || "change" === a) return te(b);
      }
      function Ge(a, b) {
        return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
      }
      var He = "function" === typeof Object.is ? Object.is : Ge;
      function Ie(a, b) {
        if (He(a, b)) return true;
        if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
        var c = Object.keys(a), d = Object.keys(b);
        if (c.length !== d.length) return false;
        for (d = 0; d < c.length; d++) {
          var e3 = c[d];
          if (!ja.call(b, e3) || !He(a[e3], b[e3])) return false;
        }
        return true;
      }
      function Je(a) {
        for (; a && a.firstChild; ) a = a.firstChild;
        return a;
      }
      function Ke(a, b) {
        var c = Je(a);
        a = 0;
        for (var d; c; ) {
          if (3 === c.nodeType) {
            d = a + c.textContent.length;
            if (a <= b && d >= b) return { node: c, offset: b - a };
            a = d;
          }
          a: {
            for (; c; ) {
              if (c.nextSibling) {
                c = c.nextSibling;
                break a;
              }
              c = c.parentNode;
            }
            c = void 0;
          }
          c = Je(c);
        }
      }
      function Le(a, b) {
        return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
      }
      function Me() {
        for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
          try {
            var c = "string" === typeof b.contentWindow.location.href;
          } catch (d) {
            c = false;
          }
          if (c) a = b.contentWindow;
          else break;
          b = Xa(a.document);
        }
        return b;
      }
      function Ne(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
      }
      function Oe(a) {
        var b = Me(), c = a.focusedElem, d = a.selectionRange;
        if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
          if (null !== d && Ne(c)) {
            if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
            else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
              a = a.getSelection();
              var e3 = c.textContent.length, f = Math.min(d.start, e3);
              d = void 0 === d.end ? f : Math.min(d.end, e3);
              !a.extend && f > d && (e3 = d, d = f, f = e3);
              e3 = Ke(c, f);
              var g = Ke(
                c,
                d
              );
              e3 && g && (1 !== a.rangeCount || a.anchorNode !== e3.node || a.anchorOffset !== e3.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e3.node, e3.offset), a.removeAllRanges(), f > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
            }
          }
          b = [];
          for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
          "function" === typeof c.focus && c.focus();
          for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
        }
      }
      var Pe = ia && "documentMode" in document && 11 >= document.documentMode;
      var Qe = null;
      var Re = null;
      var Se = null;
      var Te = false;
      function Ue(a, b, c) {
        var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
        Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
      }
      function Ve(a, b) {
        var c = {};
        c[a.toLowerCase()] = b.toLowerCase();
        c["Webkit" + a] = "webkit" + b;
        c["Moz" + a] = "moz" + b;
        return c;
      }
      var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") };
      var Xe = {};
      var Ye = {};
      ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
      function Ze(a) {
        if (Xe[a]) return Xe[a];
        if (!We[a]) return a;
        var b = We[a], c;
        for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
        return a;
      }
      var $e = Ze("animationend");
      var af = Ze("animationiteration");
      var bf = Ze("animationstart");
      var cf = Ze("transitionend");
      var df = /* @__PURE__ */ new Map();
      var ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
      function ff(a, b) {
        df.set(a, b);
        fa(b, [a]);
      }
      for (gf = 0; gf < ef.length; gf++) {
        hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
        ff(jf, "on" + kf);
      }
      var hf;
      var jf;
      var kf;
      var gf;
      ff($e, "onAnimationEnd");
      ff(af, "onAnimationIteration");
      ff(bf, "onAnimationStart");
      ff("dblclick", "onDoubleClick");
      ff("focusin", "onFocus");
      ff("focusout", "onBlur");
      ff(cf, "onTransitionEnd");
      ha("onMouseEnter", ["mouseout", "mouseover"]);
      ha("onMouseLeave", ["mouseout", "mouseover"]);
      ha("onPointerEnter", ["pointerout", "pointerover"]);
      ha("onPointerLeave", ["pointerout", "pointerover"]);
      fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
      fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
      fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
      fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
      var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
      var mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
      function nf(a, b, c) {
        var d = a.type || "unknown-event";
        a.currentTarget = c;
        Ub(d, b, void 0, a);
        a.currentTarget = null;
      }
      function se(a, b) {
        b = 0 !== (b & 4);
        for (var c = 0; c < a.length; c++) {
          var d = a[c], e3 = d.event;
          d = d.listeners;
          a: {
            var f = void 0;
            if (b) for (var g = d.length - 1; 0 <= g; g--) {
              var h = d[g], k = h.instance, l = h.currentTarget;
              h = h.listener;
              if (k !== f && e3.isPropagationStopped()) break a;
              nf(e3, h, l);
              f = k;
            }
            else for (g = 0; g < d.length; g++) {
              h = d[g];
              k = h.instance;
              l = h.currentTarget;
              h = h.listener;
              if (k !== f && e3.isPropagationStopped()) break a;
              nf(e3, h, l);
              f = k;
            }
          }
        }
        if (Qb) throw a = Rb, Qb = false, Rb = null, a;
      }
      function D(a, b) {
        var c = b[of];
        void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
        var d = a + "__bubble";
        c.has(d) || (pf(b, a, 2, false), c.add(d));
      }
      function qf(a, b, c) {
        var d = 0;
        b && (d |= 4);
        pf(c, a, d, b);
      }
      var rf = "_reactListening" + Math.random().toString(36).slice(2);
      function sf(a) {
        if (!a[rf]) {
          a[rf] = true;
          da.forEach(function(b2) {
            "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
          });
          var b = 9 === a.nodeType ? a : a.ownerDocument;
          null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
        }
      }
      function pf(a, b, c, d) {
        switch (jd(b)) {
          case 1:
            var e3 = ed;
            break;
          case 4:
            e3 = gd;
            break;
          default:
            e3 = fd;
        }
        c = e3.bind(null, b, c, a);
        e3 = void 0;
        !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e3 = true);
        d ? void 0 !== e3 ? a.addEventListener(b, c, { capture: true, passive: e3 }) : a.addEventListener(b, c, true) : void 0 !== e3 ? a.addEventListener(b, c, { passive: e3 }) : a.addEventListener(b, c, false);
      }
      function hd(a, b, c, d, e3) {
        var f = d;
        if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
          if (null === d) return;
          var g = d.tag;
          if (3 === g || 4 === g) {
            var h = d.stateNode.containerInfo;
            if (h === e3 || 8 === h.nodeType && h.parentNode === e3) break;
            if (4 === g) for (g = d.return; null !== g; ) {
              var k = g.tag;
              if (3 === k || 4 === k) {
                if (k = g.stateNode.containerInfo, k === e3 || 8 === k.nodeType && k.parentNode === e3) return;
              }
              g = g.return;
            }
            for (; null !== h; ) {
              g = Wc(h);
              if (null === g) return;
              k = g.tag;
              if (5 === k || 6 === k) {
                d = f = g;
                continue a;
              }
              h = h.parentNode;
            }
          }
          d = d.return;
        }
        Jb(function() {
          var d2 = f, e4 = xb(c), g2 = [];
          a: {
            var h2 = df.get(a);
            if (void 0 !== h2) {
              var k2 = td, n = a;
              switch (a) {
                case "keypress":
                  if (0 === od(c)) break a;
                case "keydown":
                case "keyup":
                  k2 = Rd;
                  break;
                case "focusin":
                  n = "focus";
                  k2 = Fd;
                  break;
                case "focusout":
                  n = "blur";
                  k2 = Fd;
                  break;
                case "beforeblur":
                case "afterblur":
                  k2 = Fd;
                  break;
                case "click":
                  if (2 === c.button) break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  k2 = Bd;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  k2 = Dd;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  k2 = Vd;
                  break;
                case $e:
                case af:
                case bf:
                  k2 = Hd;
                  break;
                case cf:
                  k2 = Xd;
                  break;
                case "scroll":
                  k2 = vd;
                  break;
                case "wheel":
                  k2 = Zd;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  k2 = Jd;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  k2 = Td;
              }
              var t = 0 !== (b & 4), J = !t && "scroll" === a, x = t ? null !== h2 ? h2 + "Capture" : null : h2;
              t = [];
              for (var w = d2, u; null !== w; ) {
                u = w;
                var F = u.stateNode;
                5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t.push(tf(w, F, u))));
                if (J) break;
                w = w.return;
              }
              0 < t.length && (h2 = new k2(h2, n, null, c, e4), g2.push({ event: h2, listeners: t }));
            }
          }
          if (0 === (b & 7)) {
            a: {
              h2 = "mouseover" === a || "pointerover" === a;
              k2 = "mouseout" === a || "pointerout" === a;
              if (h2 && c !== wb && (n = c.relatedTarget || c.fromElement) && (Wc(n) || n[uf])) break a;
              if (k2 || h2) {
                h2 = e4.window === e4 ? e4 : (h2 = e4.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
                if (k2) {
                  if (n = c.relatedTarget || c.toElement, k2 = d2, n = n ? Wc(n) : null, null !== n && (J = Vb(n), n !== J || 5 !== n.tag && 6 !== n.tag)) n = null;
                } else k2 = null, n = d2;
                if (k2 !== n) {
                  t = Bd;
                  F = "onMouseLeave";
                  x = "onMouseEnter";
                  w = "mouse";
                  if ("pointerout" === a || "pointerover" === a) t = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
                  J = null == k2 ? h2 : ue(k2);
                  u = null == n ? h2 : ue(n);
                  h2 = new t(F, w + "leave", k2, c, e4);
                  h2.target = J;
                  h2.relatedTarget = u;
                  F = null;
                  Wc(e4) === d2 && (t = new t(x, w + "enter", n, c, e4), t.target = u, t.relatedTarget = J, F = t);
                  J = F;
                  if (k2 && n) b: {
                    t = k2;
                    x = n;
                    w = 0;
                    for (u = t; u; u = vf(u)) w++;
                    u = 0;
                    for (F = x; F; F = vf(F)) u++;
                    for (; 0 < w - u; ) t = vf(t), w--;
                    for (; 0 < u - w; ) x = vf(x), u--;
                    for (; w--; ) {
                      if (t === x || null !== x && t === x.alternate) break b;
                      t = vf(t);
                      x = vf(x);
                    }
                    t = null;
                  }
                  else t = null;
                  null !== k2 && wf(g2, h2, k2, t, false);
                  null !== n && null !== J && wf(g2, J, n, t, true);
                }
              }
            }
            a: {
              h2 = d2 ? ue(d2) : window;
              k2 = h2.nodeName && h2.nodeName.toLowerCase();
              if ("select" === k2 || "input" === k2 && "file" === h2.type) var na = ve;
              else if (me(h2)) if (we) na = Fe;
              else {
                na = De;
                var xa = Ce;
              }
              else (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
              if (na && (na = na(a, d2))) {
                ne(g2, na, c, e4);
                break a;
              }
              xa && xa(a, h2, d2);
              "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
            }
            xa = d2 ? ue(d2) : window;
            switch (a) {
              case "focusin":
                if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
                break;
              case "focusout":
                Se = Re = Qe = null;
                break;
              case "mousedown":
                Te = true;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                Te = false;
                Ue(g2, c, e4);
                break;
              case "selectionchange":
                if (Pe) break;
              case "keydown":
              case "keyup":
                Ue(g2, c, e4);
            }
            var $a;
            if (ae) b: {
              switch (a) {
                case "compositionstart":
                  var ba = "onCompositionStart";
                  break b;
                case "compositionend":
                  ba = "onCompositionEnd";
                  break b;
                case "compositionupdate":
                  ba = "onCompositionUpdate";
                  break b;
              }
              ba = void 0;
            }
            else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
            ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e4, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e4), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
            if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e4 = new Ld("onBeforeInput", "beforeinput", null, c, e4), g2.push({ event: e4, listeners: d2 }), e4.data = $a);
          }
          se(g2, b);
        });
      }
      function tf(a, b, c) {
        return { instance: a, listener: b, currentTarget: c };
      }
      function oe(a, b) {
        for (var c = b + "Capture", d = []; null !== a; ) {
          var e3 = a, f = e3.stateNode;
          5 === e3.tag && null !== f && (e3 = f, f = Kb(a, c), null != f && d.unshift(tf(a, f, e3)), f = Kb(a, b), null != f && d.push(tf(a, f, e3)));
          a = a.return;
        }
        return d;
      }
      function vf(a) {
        if (null === a) return null;
        do
          a = a.return;
        while (a && 5 !== a.tag);
        return a ? a : null;
      }
      function wf(a, b, c, d, e3) {
        for (var f = b._reactName, g = []; null !== c && c !== d; ) {
          var h = c, k = h.alternate, l = h.stateNode;
          if (null !== k && k === d) break;
          5 === h.tag && null !== l && (h = l, e3 ? (k = Kb(c, f), null != k && g.unshift(tf(c, k, h))) : e3 || (k = Kb(c, f), null != k && g.push(tf(c, k, h))));
          c = c.return;
        }
        0 !== g.length && a.push({ event: b, listeners: g });
      }
      var xf = /\r\n?/g;
      var yf = /\u0000|\uFFFD/g;
      function zf(a) {
        return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
      }
      function Af(a, b, c) {
        b = zf(b);
        if (zf(a) !== b && c) throw Error(p(425));
      }
      function Bf() {
      }
      var Cf = null;
      var Df = null;
      function Ef(a, b) {
        return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
      }
      var Ff = "function" === typeof setTimeout ? setTimeout : void 0;
      var Gf = "function" === typeof clearTimeout ? clearTimeout : void 0;
      var Hf = "function" === typeof Promise ? Promise : void 0;
      var Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
        return Hf.resolve(null).then(a).catch(If);
      } : Ff;
      function If(a) {
        setTimeout(function() {
          throw a;
        });
      }
      function Kf(a, b) {
        var c = b, d = 0;
        do {
          var e3 = c.nextSibling;
          a.removeChild(c);
          if (e3 && 8 === e3.nodeType) if (c = e3.data, "/$" === c) {
            if (0 === d) {
              a.removeChild(e3);
              bd(b);
              return;
            }
            d--;
          } else "$" !== c && "$?" !== c && "$!" !== c || d++;
          c = e3;
        } while (c);
        bd(b);
      }
      function Lf(a) {
        for (; null != a; a = a.nextSibling) {
          var b = a.nodeType;
          if (1 === b || 3 === b) break;
          if (8 === b) {
            b = a.data;
            if ("$" === b || "$!" === b || "$?" === b) break;
            if ("/$" === b) return null;
          }
        }
        return a;
      }
      function Mf(a) {
        a = a.previousSibling;
        for (var b = 0; a; ) {
          if (8 === a.nodeType) {
            var c = a.data;
            if ("$" === c || "$!" === c || "$?" === c) {
              if (0 === b) return a;
              b--;
            } else "/$" === c && b++;
          }
          a = a.previousSibling;
        }
        return null;
      }
      var Nf = Math.random().toString(36).slice(2);
      var Of = "__reactFiber$" + Nf;
      var Pf = "__reactProps$" + Nf;
      var uf = "__reactContainer$" + Nf;
      var of = "__reactEvents$" + Nf;
      var Qf = "__reactListeners$" + Nf;
      var Rf = "__reactHandles$" + Nf;
      function Wc(a) {
        var b = a[Of];
        if (b) return b;
        for (var c = a.parentNode; c; ) {
          if (b = c[uf] || c[Of]) {
            c = b.alternate;
            if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
              if (c = a[Of]) return c;
              a = Mf(a);
            }
            return b;
          }
          a = c;
          c = a.parentNode;
        }
        return null;
      }
      function Cb(a) {
        a = a[Of] || a[uf];
        return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
      }
      function ue(a) {
        if (5 === a.tag || 6 === a.tag) return a.stateNode;
        throw Error(p(33));
      }
      function Db(a) {
        return a[Pf] || null;
      }
      var Sf = [];
      var Tf = -1;
      function Uf(a) {
        return { current: a };
      }
      function E(a) {
        0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
      }
      function G(a, b) {
        Tf++;
        Sf[Tf] = a.current;
        a.current = b;
      }
      var Vf = {};
      var H = Uf(Vf);
      var Wf = Uf(false);
      var Xf = Vf;
      function Yf(a, b) {
        var c = a.type.contextTypes;
        if (!c) return Vf;
        var d = a.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
        var e3 = {}, f;
        for (f in c) e3[f] = b[f];
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e3);
        return e3;
      }
      function Zf(a) {
        a = a.childContextTypes;
        return null !== a && void 0 !== a;
      }
      function $f() {
        E(Wf);
        E(H);
      }
      function ag(a, b, c) {
        if (H.current !== Vf) throw Error(p(168));
        G(H, b);
        G(Wf, c);
      }
      function bg(a, b, c) {
        var d = a.stateNode;
        b = b.childContextTypes;
        if ("function" !== typeof d.getChildContext) return c;
        d = d.getChildContext();
        for (var e3 in d) if (!(e3 in b)) throw Error(p(108, Ra(a) || "Unknown", e3));
        return A({}, c, d);
      }
      function cg(a) {
        a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
        Xf = H.current;
        G(H, a);
        G(Wf, Wf.current);
        return true;
      }
      function dg(a, b, c) {
        var d = a.stateNode;
        if (!d) throw Error(p(169));
        c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
        G(Wf, c);
      }
      var eg = null;
      var fg = false;
      var gg = false;
      function hg(a) {
        null === eg ? eg = [a] : eg.push(a);
      }
      function ig(a) {
        fg = true;
        hg(a);
      }
      function jg() {
        if (!gg && null !== eg) {
          gg = true;
          var a = 0, b = C;
          try {
            var c = eg;
            for (C = 1; a < c.length; a++) {
              var d = c[a];
              do
                d = d(true);
              while (null !== d);
            }
            eg = null;
            fg = false;
          } catch (e3) {
            throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e3;
          } finally {
            C = b, gg = false;
          }
        }
        return null;
      }
      var kg = [];
      var lg = 0;
      var mg = null;
      var ng = 0;
      var og = [];
      var pg = 0;
      var qg = null;
      var rg = 1;
      var sg = "";
      function tg(a, b) {
        kg[lg++] = ng;
        kg[lg++] = mg;
        mg = a;
        ng = b;
      }
      function ug(a, b, c) {
        og[pg++] = rg;
        og[pg++] = sg;
        og[pg++] = qg;
        qg = a;
        var d = rg;
        a = sg;
        var e3 = 32 - oc(d) - 1;
        d &= ~(1 << e3);
        c += 1;
        var f = 32 - oc(b) + e3;
        if (30 < f) {
          var g = e3 - e3 % 5;
          f = (d & (1 << g) - 1).toString(32);
          d >>= g;
          e3 -= g;
          rg = 1 << 32 - oc(b) + e3 | c << e3 | d;
          sg = f + a;
        } else rg = 1 << f | c << e3 | d, sg = a;
      }
      function vg(a) {
        null !== a.return && (tg(a, 1), ug(a, 1, 0));
      }
      function wg(a) {
        for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
        for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
      }
      var xg = null;
      var yg = null;
      var I = false;
      var zg = null;
      function Ag(a, b) {
        var c = Bg(5, null, null, 0);
        c.elementType = "DELETED";
        c.stateNode = b;
        c.return = a;
        b = a.deletions;
        null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
      }
      function Cg(a, b) {
        switch (a.tag) {
          case 5:
            var c = a.type;
            b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
            return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
          case 6:
            return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
          case 13:
            return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
          default:
            return false;
        }
      }
      function Dg(a) {
        return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
      }
      function Eg(a) {
        if (I) {
          var b = yg;
          if (b) {
            var c = b;
            if (!Cg(a, b)) {
              if (Dg(a)) throw Error(p(418));
              b = Lf(c.nextSibling);
              var d = xg;
              b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
            }
          } else {
            if (Dg(a)) throw Error(p(418));
            a.flags = a.flags & -4097 | 2;
            I = false;
            xg = a;
          }
        }
      }
      function Fg(a) {
        for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
        xg = a;
      }
      function Gg(a) {
        if (a !== xg) return false;
        if (!I) return Fg(a), I = true, false;
        var b;
        (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
        if (b && (b = yg)) {
          if (Dg(a)) throw Hg(), Error(p(418));
          for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
        }
        Fg(a);
        if (13 === a.tag) {
          a = a.memoizedState;
          a = null !== a ? a.dehydrated : null;
          if (!a) throw Error(p(317));
          a: {
            a = a.nextSibling;
            for (b = 0; a; ) {
              if (8 === a.nodeType) {
                var c = a.data;
                if ("/$" === c) {
                  if (0 === b) {
                    yg = Lf(a.nextSibling);
                    break a;
                  }
                  b--;
                } else "$" !== c && "$!" !== c && "$?" !== c || b++;
              }
              a = a.nextSibling;
            }
            yg = null;
          }
        } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
        return true;
      }
      function Hg() {
        for (var a = yg; a; ) a = Lf(a.nextSibling);
      }
      function Ig() {
        yg = xg = null;
        I = false;
      }
      function Jg(a) {
        null === zg ? zg = [a] : zg.push(a);
      }
      var Kg = ua.ReactCurrentBatchConfig;
      function Lg(a, b, c) {
        a = c.ref;
        if (null !== a && "function" !== typeof a && "object" !== typeof a) {
          if (c._owner) {
            c = c._owner;
            if (c) {
              if (1 !== c.tag) throw Error(p(309));
              var d = c.stateNode;
            }
            if (!d) throw Error(p(147, a));
            var e3 = d, f = "" + a;
            if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f) return b.ref;
            b = function(a2) {
              var b2 = e3.refs;
              null === a2 ? delete b2[f] : b2[f] = a2;
            };
            b._stringRef = f;
            return b;
          }
          if ("string" !== typeof a) throw Error(p(284));
          if (!c._owner) throw Error(p(290, a));
        }
        return a;
      }
      function Mg(a, b) {
        a = Object.prototype.toString.call(b);
        throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
      }
      function Ng(a) {
        var b = a._init;
        return b(a._payload);
      }
      function Og(a) {
        function b(b2, c2) {
          if (a) {
            var d2 = b2.deletions;
            null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
          }
        }
        function c(c2, d2) {
          if (!a) return null;
          for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
          return null;
        }
        function d(a2, b2) {
          for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
          return a2;
        }
        function e3(a2, b2) {
          a2 = Pg(a2, b2);
          a2.index = 0;
          a2.sibling = null;
          return a2;
        }
        function f(b2, c2, d2) {
          b2.index = d2;
          if (!a) return b2.flags |= 1048576, c2;
          d2 = b2.alternate;
          if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
          b2.flags |= 2;
          return c2;
        }
        function g(b2) {
          a && null === b2.alternate && (b2.flags |= 2);
          return b2;
        }
        function h(a2, b2, c2, d2) {
          if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e3(b2, c2);
          b2.return = a2;
          return b2;
        }
        function k(a2, b2, c2, d2) {
          var f2 = c2.type;
          if (f2 === ya) return m(a2, b2, c2.props.children, d2, c2.key);
          if (null !== b2 && (b2.elementType === f2 || "object" === typeof f2 && null !== f2 && f2.$$typeof === Ha && Ng(f2) === b2.type)) return d2 = e3(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
          d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
          d2.ref = Lg(a2, b2, c2);
          d2.return = a2;
          return d2;
        }
        function l(a2, b2, c2, d2) {
          if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e3(b2, c2.children || []);
          b2.return = a2;
          return b2;
        }
        function m(a2, b2, c2, d2, f2) {
          if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f2), b2.return = a2, b2;
          b2 = e3(b2, c2);
          b2.return = a2;
          return b2;
        }
        function q(a2, b2, c2) {
          if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
          if ("object" === typeof b2 && null !== b2) {
            switch (b2.$$typeof) {
              case va:
                return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
              case wa:
                return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
              case Ha:
                var d2 = b2._init;
                return q(a2, d2(b2._payload), c2);
            }
            if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
            Mg(a2, b2);
          }
          return null;
        }
        function r(a2, b2, c2, d2) {
          var e4 = null !== b2 ? b2.key : null;
          if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e4 ? null : h(a2, b2, "" + c2, d2);
          if ("object" === typeof c2 && null !== c2) {
            switch (c2.$$typeof) {
              case va:
                return c2.key === e4 ? k(a2, b2, c2, d2) : null;
              case wa:
                return c2.key === e4 ? l(a2, b2, c2, d2) : null;
              case Ha:
                return e4 = c2._init, r(
                  a2,
                  b2,
                  e4(c2._payload),
                  d2
                );
            }
            if (eb(c2) || Ka(c2)) return null !== e4 ? null : m(a2, b2, c2, d2, null);
            Mg(a2, c2);
          }
          return null;
        }
        function y(a2, b2, c2, d2, e4) {
          if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e4);
          if ("object" === typeof d2 && null !== d2) {
            switch (d2.$$typeof) {
              case va:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k(b2, a2, d2, e4);
              case wa:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l(b2, a2, d2, e4);
              case Ha:
                var f2 = d2._init;
                return y(a2, b2, c2, f2(d2._payload), e4);
            }
            if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m(b2, a2, d2, e4, null);
            Mg(b2, d2);
          }
          return null;
        }
        function n(e4, g2, h2, k2) {
          for (var l2 = null, m2 = null, u = g2, w = g2 = 0, x = null; null !== u && w < h2.length; w++) {
            u.index > w ? (x = u, u = null) : x = u.sibling;
            var n2 = r(e4, u, h2[w], k2);
            if (null === n2) {
              null === u && (u = x);
              break;
            }
            a && u && null === n2.alternate && b(e4, u);
            g2 = f(n2, g2, w);
            null === m2 ? l2 = n2 : m2.sibling = n2;
            m2 = n2;
            u = x;
          }
          if (w === h2.length) return c(e4, u), I && tg(e4, w), l2;
          if (null === u) {
            for (; w < h2.length; w++) u = q(e4, h2[w], k2), null !== u && (g2 = f(u, g2, w), null === m2 ? l2 = u : m2.sibling = u, m2 = u);
            I && tg(e4, w);
            return l2;
          }
          for (u = d(e4, u); w < h2.length; w++) x = y(u, e4, w, h2[w], k2), null !== x && (a && null !== x.alternate && u.delete(null === x.key ? w : x.key), g2 = f(x, g2, w), null === m2 ? l2 = x : m2.sibling = x, m2 = x);
          a && u.forEach(function(a2) {
            return b(e4, a2);
          });
          I && tg(e4, w);
          return l2;
        }
        function t(e4, g2, h2, k2) {
          var l2 = Ka(h2);
          if ("function" !== typeof l2) throw Error(p(150));
          h2 = l2.call(h2);
          if (null == h2) throw Error(p(151));
          for (var u = l2 = null, m2 = g2, w = g2 = 0, x = null, n2 = h2.next(); null !== m2 && !n2.done; w++, n2 = h2.next()) {
            m2.index > w ? (x = m2, m2 = null) : x = m2.sibling;
            var t2 = r(e4, m2, n2.value, k2);
            if (null === t2) {
              null === m2 && (m2 = x);
              break;
            }
            a && m2 && null === t2.alternate && b(e4, m2);
            g2 = f(t2, g2, w);
            null === u ? l2 = t2 : u.sibling = t2;
            u = t2;
            m2 = x;
          }
          if (n2.done) return c(
            e4,
            m2
          ), I && tg(e4, w), l2;
          if (null === m2) {
            for (; !n2.done; w++, n2 = h2.next()) n2 = q(e4, n2.value, k2), null !== n2 && (g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
            I && tg(e4, w);
            return l2;
          }
          for (m2 = d(e4, m2); !n2.done; w++, n2 = h2.next()) n2 = y(m2, e4, w, n2.value, k2), null !== n2 && (a && null !== n2.alternate && m2.delete(null === n2.key ? w : n2.key), g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
          a && m2.forEach(function(a2) {
            return b(e4, a2);
          });
          I && tg(e4, w);
          return l2;
        }
        function J(a2, d2, f2, h2) {
          "object" === typeof f2 && null !== f2 && f2.type === ya && null === f2.key && (f2 = f2.props.children);
          if ("object" === typeof f2 && null !== f2) {
            switch (f2.$$typeof) {
              case va:
                a: {
                  for (var k2 = f2.key, l2 = d2; null !== l2; ) {
                    if (l2.key === k2) {
                      k2 = f2.type;
                      if (k2 === ya) {
                        if (7 === l2.tag) {
                          c(a2, l2.sibling);
                          d2 = e3(l2, f2.props.children);
                          d2.return = a2;
                          a2 = d2;
                          break a;
                        }
                      } else if (l2.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && Ng(k2) === l2.type) {
                        c(a2, l2.sibling);
                        d2 = e3(l2, f2.props);
                        d2.ref = Lg(a2, l2, f2);
                        d2.return = a2;
                        a2 = d2;
                        break a;
                      }
                      c(a2, l2);
                      break;
                    } else b(a2, l2);
                    l2 = l2.sibling;
                  }
                  f2.type === ya ? (d2 = Tg(f2.props.children, a2.mode, h2, f2.key), d2.return = a2, a2 = d2) : (h2 = Rg(f2.type, f2.key, f2.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f2), h2.return = a2, a2 = h2);
                }
                return g(a2);
              case wa:
                a: {
                  for (l2 = f2.key; null !== d2; ) {
                    if (d2.key === l2) if (4 === d2.tag && d2.stateNode.containerInfo === f2.containerInfo && d2.stateNode.implementation === f2.implementation) {
                      c(a2, d2.sibling);
                      d2 = e3(d2, f2.children || []);
                      d2.return = a2;
                      a2 = d2;
                      break a;
                    } else {
                      c(a2, d2);
                      break;
                    }
                    else b(a2, d2);
                    d2 = d2.sibling;
                  }
                  d2 = Sg(f2, a2.mode, h2);
                  d2.return = a2;
                  a2 = d2;
                }
                return g(a2);
              case Ha:
                return l2 = f2._init, J(a2, d2, l2(f2._payload), h2);
            }
            if (eb(f2)) return n(a2, d2, f2, h2);
            if (Ka(f2)) return t(a2, d2, f2, h2);
            Mg(a2, f2);
          }
          return "string" === typeof f2 && "" !== f2 || "number" === typeof f2 ? (f2 = "" + f2, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e3(d2, f2), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f2, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
        }
        return J;
      }
      var Ug = Og(true);
      var Vg = Og(false);
      var Wg = Uf(null);
      var Xg = null;
      var Yg = null;
      var Zg = null;
      function $g() {
        Zg = Yg = Xg = null;
      }
      function ah(a) {
        var b = Wg.current;
        E(Wg);
        a._currentValue = b;
      }
      function bh(a, b, c) {
        for (; null !== a; ) {
          var d = a.alternate;
          (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
          if (a === c) break;
          a = a.return;
        }
      }
      function ch(a, b) {
        Xg = a;
        Zg = Yg = null;
        a = a.dependencies;
        null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
      }
      function eh(a) {
        var b = a._currentValue;
        if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
          if (null === Xg) throw Error(p(308));
          Yg = a;
          Xg.dependencies = { lanes: 0, firstContext: a };
        } else Yg = Yg.next = a;
        return b;
      }
      var fh = null;
      function gh(a) {
        null === fh ? fh = [a] : fh.push(a);
      }
      function hh(a, b, c, d) {
        var e3 = b.interleaved;
        null === e3 ? (c.next = c, gh(b)) : (c.next = e3.next, e3.next = c);
        b.interleaved = c;
        return ih(a, d);
      }
      function ih(a, b) {
        a.lanes |= b;
        var c = a.alternate;
        null !== c && (c.lanes |= b);
        c = a;
        for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
        return 3 === c.tag ? c.stateNode : null;
      }
      var jh = false;
      function kh(a) {
        a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
      }
      function lh(a, b) {
        a = a.updateQueue;
        b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
      }
      function mh(a, b) {
        return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
      }
      function nh(a, b, c) {
        var d = a.updateQueue;
        if (null === d) return null;
        d = d.shared;
        if (0 !== (K & 2)) {
          var e3 = d.pending;
          null === e3 ? b.next = b : (b.next = e3.next, e3.next = b);
          d.pending = b;
          return ih(a, c);
        }
        e3 = d.interleaved;
        null === e3 ? (b.next = b, gh(d)) : (b.next = e3.next, e3.next = b);
        d.interleaved = b;
        return ih(a, c);
      }
      function oh(a, b, c) {
        b = b.updateQueue;
        if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      function ph(a, b) {
        var c = a.updateQueue, d = a.alternate;
        if (null !== d && (d = d.updateQueue, c === d)) {
          var e3 = null, f = null;
          c = c.firstBaseUpdate;
          if (null !== c) {
            do {
              var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
              null === f ? e3 = f = g : f = f.next = g;
              c = c.next;
            } while (null !== c);
            null === f ? e3 = f = b : f = f.next = b;
          } else e3 = f = b;
          c = { baseState: d.baseState, firstBaseUpdate: e3, lastBaseUpdate: f, shared: d.shared, effects: d.effects };
          a.updateQueue = c;
          return;
        }
        a = c.lastBaseUpdate;
        null === a ? c.firstBaseUpdate = b : a.next = b;
        c.lastBaseUpdate = b;
      }
      function qh(a, b, c, d) {
        var e3 = a.updateQueue;
        jh = false;
        var f = e3.firstBaseUpdate, g = e3.lastBaseUpdate, h = e3.shared.pending;
        if (null !== h) {
          e3.shared.pending = null;
          var k = h, l = k.next;
          k.next = null;
          null === g ? f = l : g.next = l;
          g = k;
          var m = a.alternate;
          null !== m && (m = m.updateQueue, h = m.lastBaseUpdate, h !== g && (null === h ? m.firstBaseUpdate = l : h.next = l, m.lastBaseUpdate = k));
        }
        if (null !== f) {
          var q = e3.baseState;
          g = 0;
          m = l = k = null;
          h = f;
          do {
            var r = h.lane, y = h.eventTime;
            if ((d & r) === r) {
              null !== m && (m = m.next = {
                eventTime: y,
                lane: 0,
                tag: h.tag,
                payload: h.payload,
                callback: h.callback,
                next: null
              });
              a: {
                var n = a, t = h;
                r = b;
                y = c;
                switch (t.tag) {
                  case 1:
                    n = t.payload;
                    if ("function" === typeof n) {
                      q = n.call(y, q, r);
                      break a;
                    }
                    q = n;
                    break a;
                  case 3:
                    n.flags = n.flags & -65537 | 128;
                  case 0:
                    n = t.payload;
                    r = "function" === typeof n ? n.call(y, q, r) : n;
                    if (null === r || void 0 === r) break a;
                    q = A({}, q, r);
                    break a;
                  case 2:
                    jh = true;
                }
              }
              null !== h.callback && 0 !== h.lane && (a.flags |= 64, r = e3.effects, null === r ? e3.effects = [h] : r.push(h));
            } else y = { eventTime: y, lane: r, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m ? (l = m = y, k = q) : m = m.next = y, g |= r;
            h = h.next;
            if (null === h) if (h = e3.shared.pending, null === h) break;
            else r = h, h = r.next, r.next = null, e3.lastBaseUpdate = r, e3.shared.pending = null;
          } while (1);
          null === m && (k = q);
          e3.baseState = k;
          e3.firstBaseUpdate = l;
          e3.lastBaseUpdate = m;
          b = e3.shared.interleaved;
          if (null !== b) {
            e3 = b;
            do
              g |= e3.lane, e3 = e3.next;
            while (e3 !== b);
          } else null === f && (e3.shared.lanes = 0);
          rh |= g;
          a.lanes = g;
          a.memoizedState = q;
        }
      }
      function sh(a, b, c) {
        a = b.effects;
        b.effects = null;
        if (null !== a) for (b = 0; b < a.length; b++) {
          var d = a[b], e3 = d.callback;
          if (null !== e3) {
            d.callback = null;
            d = c;
            if ("function" !== typeof e3) throw Error(p(191, e3));
            e3.call(d);
          }
        }
      }
      var th = {};
      var uh = Uf(th);
      var vh = Uf(th);
      var wh = Uf(th);
      function xh(a) {
        if (a === th) throw Error(p(174));
        return a;
      }
      function yh(a, b) {
        G(wh, b);
        G(vh, a);
        G(uh, th);
        a = b.nodeType;
        switch (a) {
          case 9:
          case 11:
            b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
            break;
          default:
            a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
        }
        E(uh);
        G(uh, b);
      }
      function zh() {
        E(uh);
        E(vh);
        E(wh);
      }
      function Ah(a) {
        xh(wh.current);
        var b = xh(uh.current);
        var c = lb(b, a.type);
        b !== c && (G(vh, a), G(uh, c));
      }
      function Bh(a) {
        vh.current === a && (E(uh), E(vh));
      }
      var L = Uf(0);
      function Ch(a) {
        for (var b = a; null !== b; ) {
          if (13 === b.tag) {
            var c = b.memoizedState;
            if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
          } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
            if (0 !== (b.flags & 128)) return b;
          } else if (null !== b.child) {
            b.child.return = b;
            b = b.child;
            continue;
          }
          if (b === a) break;
          for (; null === b.sibling; ) {
            if (null === b.return || b.return === a) return null;
            b = b.return;
          }
          b.sibling.return = b.return;
          b = b.sibling;
        }
        return null;
      }
      var Dh = [];
      function Eh() {
        for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
        Dh.length = 0;
      }
      var Fh = ua.ReactCurrentDispatcher;
      var Gh = ua.ReactCurrentBatchConfig;
      var Hh = 0;
      var M = null;
      var N = null;
      var O = null;
      var Ih = false;
      var Jh = false;
      var Kh = 0;
      var Lh = 0;
      function P() {
        throw Error(p(321));
      }
      function Mh(a, b) {
        if (null === b) return false;
        for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
        return true;
      }
      function Nh(a, b, c, d, e3, f) {
        Hh = f;
        M = b;
        b.memoizedState = null;
        b.updateQueue = null;
        b.lanes = 0;
        Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
        a = c(d, e3);
        if (Jh) {
          f = 0;
          do {
            Jh = false;
            Kh = 0;
            if (25 <= f) throw Error(p(301));
            f += 1;
            O = N = null;
            b.updateQueue = null;
            Fh.current = Qh;
            a = c(d, e3);
          } while (Jh);
        }
        Fh.current = Rh;
        b = null !== N && null !== N.next;
        Hh = 0;
        O = N = M = null;
        Ih = false;
        if (b) throw Error(p(300));
        return a;
      }
      function Sh() {
        var a = 0 !== Kh;
        Kh = 0;
        return a;
      }
      function Th() {
        var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
        null === O ? M.memoizedState = O = a : O = O.next = a;
        return O;
      }
      function Uh() {
        if (null === N) {
          var a = M.alternate;
          a = null !== a ? a.memoizedState : null;
        } else a = N.next;
        var b = null === O ? M.memoizedState : O.next;
        if (null !== b) O = b, N = a;
        else {
          if (null === a) throw Error(p(310));
          N = a;
          a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
          null === O ? M.memoizedState = O = a : O = O.next = a;
        }
        return O;
      }
      function Vh(a, b) {
        return "function" === typeof b ? b(a) : b;
      }
      function Wh(a) {
        var b = Uh(), c = b.queue;
        if (null === c) throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = N, e3 = d.baseQueue, f = c.pending;
        if (null !== f) {
          if (null !== e3) {
            var g = e3.next;
            e3.next = f.next;
            f.next = g;
          }
          d.baseQueue = e3 = f;
          c.pending = null;
        }
        if (null !== e3) {
          f = e3.next;
          d = d.baseState;
          var h = g = null, k = null, l = f;
          do {
            var m = l.lane;
            if ((Hh & m) === m) null !== k && (k = k.next = { lane: 0, action: l.action, hasEagerState: l.hasEagerState, eagerState: l.eagerState, next: null }), d = l.hasEagerState ? l.eagerState : a(d, l.action);
            else {
              var q = {
                lane: m,
                action: l.action,
                hasEagerState: l.hasEagerState,
                eagerState: l.eagerState,
                next: null
              };
              null === k ? (h = k = q, g = d) : k = k.next = q;
              M.lanes |= m;
              rh |= m;
            }
            l = l.next;
          } while (null !== l && l !== f);
          null === k ? g = d : k.next = h;
          He(d, b.memoizedState) || (dh = true);
          b.memoizedState = d;
          b.baseState = g;
          b.baseQueue = k;
          c.lastRenderedState = d;
        }
        a = c.interleaved;
        if (null !== a) {
          e3 = a;
          do
            f = e3.lane, M.lanes |= f, rh |= f, e3 = e3.next;
          while (e3 !== a);
        } else null === e3 && (c.lanes = 0);
        return [b.memoizedState, c.dispatch];
      }
      function Xh(a) {
        var b = Uh(), c = b.queue;
        if (null === c) throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = c.dispatch, e3 = c.pending, f = b.memoizedState;
        if (null !== e3) {
          c.pending = null;
          var g = e3 = e3.next;
          do
            f = a(f, g.action), g = g.next;
          while (g !== e3);
          He(f, b.memoizedState) || (dh = true);
          b.memoizedState = f;
          null === b.baseQueue && (b.baseState = f);
          c.lastRenderedState = f;
        }
        return [f, d];
      }
      function Yh() {
      }
      function Zh(a, b) {
        var c = M, d = Uh(), e3 = b(), f = !He(d.memoizedState, e3);
        f && (d.memoizedState = e3, dh = true);
        d = d.queue;
        $h(ai.bind(null, c, d, a), [a]);
        if (d.getSnapshot !== b || f || null !== O && O.memoizedState.tag & 1) {
          c.flags |= 2048;
          bi(9, ci.bind(null, c, d, e3, b), void 0, null);
          if (null === Q) throw Error(p(349));
          0 !== (Hh & 30) || di(c, b, e3);
        }
        return e3;
      }
      function di(a, b, c) {
        a.flags |= 16384;
        a = { getSnapshot: b, value: c };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
      }
      function ci(a, b, c, d) {
        b.value = c;
        b.getSnapshot = d;
        ei(b) && fi(a);
      }
      function ai(a, b, c) {
        return c(function() {
          ei(b) && fi(a);
        });
      }
      function ei(a) {
        var b = a.getSnapshot;
        a = a.value;
        try {
          var c = b();
          return !He(a, c);
        } catch (d) {
          return true;
        }
      }
      function fi(a) {
        var b = ih(a, 1);
        null !== b && gi(b, a, 1, -1);
      }
      function hi(a) {
        var b = Th();
        "function" === typeof a && (a = a());
        b.memoizedState = b.baseState = a;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
        b.queue = a;
        a = a.dispatch = ii.bind(null, M, a);
        return [b.memoizedState, a];
      }
      function bi(a, b, c, d) {
        a = { tag: a, create: b, destroy: c, deps: d, next: null };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
        return a;
      }
      function ji() {
        return Uh().memoizedState;
      }
      function ki(a, b, c, d) {
        var e3 = Th();
        M.flags |= a;
        e3.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
      }
      function li(a, b, c, d) {
        var e3 = Uh();
        d = void 0 === d ? null : d;
        var f = void 0;
        if (null !== N) {
          var g = N.memoizedState;
          f = g.destroy;
          if (null !== d && Mh(d, g.deps)) {
            e3.memoizedState = bi(b, c, f, d);
            return;
          }
        }
        M.flags |= a;
        e3.memoizedState = bi(1 | b, c, f, d);
      }
      function mi(a, b) {
        return ki(8390656, 8, a, b);
      }
      function $h(a, b) {
        return li(2048, 8, a, b);
      }
      function ni(a, b) {
        return li(4, 2, a, b);
      }
      function oi(a, b) {
        return li(4, 4, a, b);
      }
      function pi(a, b) {
        if ("function" === typeof b) return a = a(), b(a), function() {
          b(null);
        };
        if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
          b.current = null;
        };
      }
      function qi(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return li(4, 4, pi.bind(null, b, a), c);
      }
      function ri() {
      }
      function si(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1])) return d[0];
        c.memoizedState = [a, b];
        return a;
      }
      function ti(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1])) return d[0];
        a = a();
        c.memoizedState = [a, b];
        return a;
      }
      function ui(a, b, c) {
        if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
        He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
        return b;
      }
      function vi(a, b) {
        var c = C;
        C = 0 !== c && 4 > c ? c : 4;
        a(true);
        var d = Gh.transition;
        Gh.transition = {};
        try {
          a(false), b();
        } finally {
          C = c, Gh.transition = d;
        }
      }
      function wi() {
        return Uh().memoizedState;
      }
      function xi(a, b, c) {
        var d = yi(a);
        c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a)) Ai(b, c);
        else if (c = hh(a, b, c, d), null !== c) {
          var e3 = R();
          gi(c, a, d, e3);
          Bi(c, b, d);
        }
      }
      function ii(a, b, c) {
        var d = yi(a), e3 = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a)) Ai(b, e3);
        else {
          var f = a.alternate;
          if (0 === a.lanes && (null === f || 0 === f.lanes) && (f = b.lastRenderedReducer, null !== f)) try {
            var g = b.lastRenderedState, h = f(g, c);
            e3.hasEagerState = true;
            e3.eagerState = h;
            if (He(h, g)) {
              var k = b.interleaved;
              null === k ? (e3.next = e3, gh(b)) : (e3.next = k.next, k.next = e3);
              b.interleaved = e3;
              return;
            }
          } catch (l) {
          } finally {
          }
          c = hh(a, b, e3, d);
          null !== c && (e3 = R(), gi(c, a, d, e3), Bi(c, b, d));
        }
      }
      function zi(a) {
        var b = a.alternate;
        return a === M || null !== b && b === M;
      }
      function Ai(a, b) {
        Jh = Ih = true;
        var c = a.pending;
        null === c ? b.next = b : (b.next = c.next, c.next = b);
        a.pending = b;
      }
      function Bi(a, b, c) {
        if (0 !== (c & 4194240)) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false };
      var Oh = { readContext: eh, useCallback: function(a, b) {
        Th().memoizedState = [a, void 0 === b ? null : b];
        return a;
      }, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return ki(
          4194308,
          4,
          pi.bind(null, b, a),
          c
        );
      }, useLayoutEffect: function(a, b) {
        return ki(4194308, 4, a, b);
      }, useInsertionEffect: function(a, b) {
        return ki(4, 2, a, b);
      }, useMemo: function(a, b) {
        var c = Th();
        b = void 0 === b ? null : b;
        a = a();
        c.memoizedState = [a, b];
        return a;
      }, useReducer: function(a, b, c) {
        var d = Th();
        b = void 0 !== c ? c(b) : b;
        d.memoizedState = d.baseState = b;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
        d.queue = a;
        a = a.dispatch = xi.bind(null, M, a);
        return [d.memoizedState, a];
      }, useRef: function(a) {
        var b = Th();
        a = { current: a };
        return b.memoizedState = a;
      }, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
        return Th().memoizedState = a;
      }, useTransition: function() {
        var a = hi(false), b = a[0];
        a = vi.bind(null, a[1]);
        Th().memoizedState = a;
        return [b, a];
      }, useMutableSource: function() {
      }, useSyncExternalStore: function(a, b, c) {
        var d = M, e3 = Th();
        if (I) {
          if (void 0 === c) throw Error(p(407));
          c = c();
        } else {
          c = b();
          if (null === Q) throw Error(p(349));
          0 !== (Hh & 30) || di(d, b, c);
        }
        e3.memoizedState = c;
        var f = { value: c, getSnapshot: b };
        e3.queue = f;
        mi(ai.bind(
          null,
          d,
          f,
          a
        ), [a]);
        d.flags |= 2048;
        bi(9, ci.bind(null, d, f, c, b), void 0, null);
        return c;
      }, useId: function() {
        var a = Th(), b = Q.identifierPrefix;
        if (I) {
          var c = sg;
          var d = rg;
          c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
          b = ":" + b + "R" + c;
          c = Kh++;
          0 < c && (b += "H" + c.toString(32));
          b += ":";
        } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
        return a.memoizedState = b;
      }, unstable_isNewReconciler: false };
      var Ph = {
        readContext: eh,
        useCallback: si,
        useContext: eh,
        useEffect: $h,
        useImperativeHandle: qi,
        useInsertionEffect: ni,
        useLayoutEffect: oi,
        useMemo: ti,
        useReducer: Wh,
        useRef: ji,
        useState: function() {
          return Wh(Vh);
        },
        useDebugValue: ri,
        useDeferredValue: function(a) {
          var b = Uh();
          return ui(b, N.memoizedState, a);
        },
        useTransition: function() {
          var a = Wh(Vh)[0], b = Uh().memoizedState;
          return [a, b];
        },
        useMutableSource: Yh,
        useSyncExternalStore: Zh,
        useId: wi,
        unstable_isNewReconciler: false
      };
      var Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
        return Xh(Vh);
      }, useDebugValue: ri, useDeferredValue: function(a) {
        var b = Uh();
        return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
      }, useTransition: function() {
        var a = Xh(Vh)[0], b = Uh().memoizedState;
        return [a, b];
      }, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
      function Ci(a, b) {
        if (a && a.defaultProps) {
          b = A({}, b);
          a = a.defaultProps;
          for (var c in a) void 0 === b[c] && (b[c] = a[c]);
          return b;
        }
        return b;
      }
      function Di(a, b, c, d) {
        b = a.memoizedState;
        c = c(d, b);
        c = null === c || void 0 === c ? b : A({}, b, c);
        a.memoizedState = c;
        0 === a.lanes && (a.updateQueue.baseState = c);
      }
      var Ei = { isMounted: function(a) {
        return (a = a._reactInternals) ? Vb(a) === a : false;
      }, enqueueSetState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e3 = yi(a), f = mh(d, e3);
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e3);
        null !== b && (gi(b, a, e3, d), oh(b, a, e3));
      }, enqueueReplaceState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e3 = yi(a), f = mh(d, e3);
        f.tag = 1;
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e3);
        null !== b && (gi(b, a, e3, d), oh(b, a, e3));
      }, enqueueForceUpdate: function(a, b) {
        a = a._reactInternals;
        var c = R(), d = yi(a), e3 = mh(c, d);
        e3.tag = 2;
        void 0 !== b && null !== b && (e3.callback = b);
        b = nh(a, e3, d);
        null !== b && (gi(b, a, d, c), oh(b, a, d));
      } };
      function Fi(a, b, c, d, e3, f, g) {
        a = a.stateNode;
        return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e3, f) : true;
      }
      function Gi(a, b, c) {
        var d = false, e3 = Vf;
        var f = b.contextType;
        "object" === typeof f && null !== f ? f = eh(f) : (e3 = Zf(b) ? Xf : H.current, d = b.contextTypes, f = (d = null !== d && void 0 !== d) ? Yf(a, e3) : Vf);
        b = new b(c, f);
        a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
        b.updater = Ei;
        a.stateNode = b;
        b._reactInternals = a;
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e3, a.__reactInternalMemoizedMaskedChildContext = f);
        return b;
      }
      function Hi(a, b, c, d) {
        a = b.state;
        "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
        "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
        b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
      }
      function Ii(a, b, c, d) {
        var e3 = a.stateNode;
        e3.props = c;
        e3.state = a.memoizedState;
        e3.refs = {};
        kh(a);
        var f = b.contextType;
        "object" === typeof f && null !== f ? e3.context = eh(f) : (f = Zf(b) ? Xf : H.current, e3.context = Yf(a, f));
        e3.state = a.memoizedState;
        f = b.getDerivedStateFromProps;
        "function" === typeof f && (Di(a, b, f, c), e3.state = a.memoizedState);
        "function" === typeof b.getDerivedStateFromProps || "function" === typeof e3.getSnapshotBeforeUpdate || "function" !== typeof e3.UNSAFE_componentWillMount && "function" !== typeof e3.componentWillMount || (b = e3.state, "function" === typeof e3.componentWillMount && e3.componentWillMount(), "function" === typeof e3.UNSAFE_componentWillMount && e3.UNSAFE_componentWillMount(), b !== e3.state && Ei.enqueueReplaceState(e3, e3.state, null), qh(a, c, e3, d), e3.state = a.memoizedState);
        "function" === typeof e3.componentDidMount && (a.flags |= 4194308);
      }
      function Ji(a, b) {
        try {
          var c = "", d = b;
          do
            c += Pa(d), d = d.return;
          while (d);
          var e3 = c;
        } catch (f) {
          e3 = "\nError generating stack: " + f.message + "\n" + f.stack;
        }
        return { value: a, source: b, stack: e3, digest: null };
      }
      function Ki(a, b, c) {
        return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
      }
      function Li(a, b) {
        try {
          console.error(b.value);
        } catch (c) {
          setTimeout(function() {
            throw c;
          });
        }
      }
      var Mi = "function" === typeof WeakMap ? WeakMap : Map;
      function Ni(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        c.payload = { element: null };
        var d = b.value;
        c.callback = function() {
          Oi || (Oi = true, Pi = d);
          Li(a, b);
        };
        return c;
      }
      function Qi(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        var d = a.type.getDerivedStateFromError;
        if ("function" === typeof d) {
          var e3 = b.value;
          c.payload = function() {
            return d(e3);
          };
          c.callback = function() {
            Li(a, b);
          };
        }
        var f = a.stateNode;
        null !== f && "function" === typeof f.componentDidCatch && (c.callback = function() {
          Li(a, b);
          "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
          var c2 = b.stack;
          this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
        });
        return c;
      }
      function Si(a, b, c) {
        var d = a.pingCache;
        if (null === d) {
          d = a.pingCache = new Mi();
          var e3 = /* @__PURE__ */ new Set();
          d.set(b, e3);
        } else e3 = d.get(b), void 0 === e3 && (e3 = /* @__PURE__ */ new Set(), d.set(b, e3));
        e3.has(c) || (e3.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
      }
      function Ui(a) {
        do {
          var b;
          if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
          if (b) return a;
          a = a.return;
        } while (null !== a);
        return null;
      }
      function Vi(a, b, c, d, e3) {
        if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
        a.flags |= 65536;
        a.lanes = e3;
        return a;
      }
      var Wi = ua.ReactCurrentOwner;
      var dh = false;
      function Xi(a, b, c, d) {
        b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
      }
      function Yi(a, b, c, d, e3) {
        c = c.render;
        var f = b.ref;
        ch(b, e3);
        d = Nh(a, b, c, d, f, e3);
        c = Sh();
        if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e3, Zi(a, b, e3);
        I && c && vg(b);
        b.flags |= 1;
        Xi(a, b, d, e3);
        return b.child;
      }
      function $i(a, b, c, d, e3) {
        if (null === a) {
          var f = c.type;
          if ("function" === typeof f && !aj(f) && void 0 === f.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f, bj(a, b, f, d, e3);
          a = Rg(c.type, null, d, b, b.mode, e3);
          a.ref = b.ref;
          a.return = b;
          return b.child = a;
        }
        f = a.child;
        if (0 === (a.lanes & e3)) {
          var g = f.memoizedProps;
          c = c.compare;
          c = null !== c ? c : Ie;
          if (c(g, d) && a.ref === b.ref) return Zi(a, b, e3);
        }
        b.flags |= 1;
        a = Pg(f, d);
        a.ref = b.ref;
        a.return = b;
        return b.child = a;
      }
      function bj(a, b, c, d, e3) {
        if (null !== a) {
          var f = a.memoizedProps;
          if (Ie(f, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f, 0 !== (a.lanes & e3)) 0 !== (a.flags & 131072) && (dh = true);
          else return b.lanes = a.lanes, Zi(a, b, e3);
        }
        return cj(a, b, c, d, e3);
      }
      function dj(a, b, c) {
        var d = b.pendingProps, e3 = d.children, f = null !== a ? a.memoizedState : null;
        if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
        else {
          if (0 === (c & 1073741824)) return a = null !== f ? f.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
          b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
          d = null !== f ? f.baseLanes : c;
          G(ej, fj);
          fj |= d;
        }
        else null !== f ? (d = f.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
        Xi(a, b, e3, c);
        return b.child;
      }
      function gj(a, b) {
        var c = b.ref;
        if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
      }
      function cj(a, b, c, d, e3) {
        var f = Zf(c) ? Xf : H.current;
        f = Yf(b, f);
        ch(b, e3);
        c = Nh(a, b, c, d, f, e3);
        d = Sh();
        if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e3, Zi(a, b, e3);
        I && d && vg(b);
        b.flags |= 1;
        Xi(a, b, c, e3);
        return b.child;
      }
      function hj(a, b, c, d, e3) {
        if (Zf(c)) {
          var f = true;
          cg(b);
        } else f = false;
        ch(b, e3);
        if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e3), d = true;
        else if (null === a) {
          var g = b.stateNode, h = b.memoizedProps;
          g.props = h;
          var k = g.context, l = c.contextType;
          "object" === typeof l && null !== l ? l = eh(l) : (l = Zf(c) ? Xf : H.current, l = Yf(b, l));
          var m = c.getDerivedStateFromProps, q = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
          q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Hi(b, g, d, l);
          jh = false;
          var r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e3);
          k = b.memoizedState;
          h !== d || r !== k || Wf.current || jh ? ("function" === typeof m && (Di(b, c, m, d), k = b.memoizedState), (h = jh || Fi(b, c, h, d, r, k, l)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
        } else {
          g = b.stateNode;
          lh(a, b);
          h = b.memoizedProps;
          l = b.type === b.elementType ? h : Ci(b.type, h);
          g.props = l;
          q = b.pendingProps;
          r = g.context;
          k = c.contextType;
          "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
          var y = c.getDerivedStateFromProps;
          (m = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r !== k) && Hi(b, g, d, k);
          jh = false;
          r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e3);
          var n = b.memoizedState;
          h !== q || r !== n || Wf.current || jh ? ("function" === typeof y && (Di(b, c, y, d), n = b.memoizedState), (l = jh || Fi(b, c, l, d, r, n, k) || false) ? (m || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n), g.props = d, g.state = n, g.context = k, d = l) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), d = false);
        }
        return jj(a, b, c, d, f, e3);
      }
      function jj(a, b, c, d, e3, f) {
        gj(a, b);
        var g = 0 !== (b.flags & 128);
        if (!d && !g) return e3 && dg(b, c, false), Zi(a, b, f);
        d = b.stateNode;
        Wi.current = b;
        var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
        b.flags |= 1;
        null !== a && g ? (b.child = Ug(b, a.child, null, f), b.child = Ug(b, null, h, f)) : Xi(a, b, h, f);
        b.memoizedState = d.state;
        e3 && dg(b, c, true);
        return b.child;
      }
      function kj(a) {
        var b = a.stateNode;
        b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
        yh(a, b.containerInfo);
      }
      function lj(a, b, c, d, e3) {
        Ig();
        Jg(e3);
        b.flags |= 256;
        Xi(a, b, c, d);
        return b.child;
      }
      var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
      function nj(a) {
        return { baseLanes: a, cachePool: null, transitions: null };
      }
      function oj(a, b, c) {
        var d = b.pendingProps, e3 = L.current, f = false, g = 0 !== (b.flags & 128), h;
        (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e3 & 2));
        if (h) f = true, b.flags &= -129;
        else if (null === a || null !== a.memoizedState) e3 |= 1;
        G(L, e3 & 1);
        if (null === a) {
          Eg(b);
          a = b.memoizedState;
          if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
          g = d.children;
          a = d.fallback;
          return f ? (d = b.mode, f = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f ? (f.childLanes = 0, f.pendingProps = g) : f = pj(g, d, 0, null), a = Tg(a, d, c, null), f.return = b, a.return = b, f.sibling = a, b.child = f, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
        }
        e3 = a.memoizedState;
        if (null !== e3 && (h = e3.dehydrated, null !== h)) return rj(a, b, g, d, h, e3, c);
        if (f) {
          f = d.fallback;
          g = b.mode;
          e3 = a.child;
          h = e3.sibling;
          var k = { mode: "hidden", children: d.children };
          0 === (g & 1) && b.child !== e3 ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e3, k), d.subtreeFlags = e3.subtreeFlags & 14680064);
          null !== h ? f = Pg(h, f) : (f = Tg(f, g, c, null), f.flags |= 2);
          f.return = b;
          d.return = b;
          d.sibling = f;
          b.child = d;
          d = f;
          f = b.child;
          g = a.child.memoizedState;
          g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
          f.memoizedState = g;
          f.childLanes = a.childLanes & ~c;
          b.memoizedState = mj;
          return d;
        }
        f = a.child;
        a = f.sibling;
        d = Pg(f, { mode: "visible", children: d.children });
        0 === (b.mode & 1) && (d.lanes = c);
        d.return = b;
        d.sibling = null;
        null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
        b.child = d;
        b.memoizedState = null;
        return d;
      }
      function qj(a, b) {
        b = pj({ mode: "visible", children: b }, a.mode, 0, null);
        b.return = a;
        return a.child = b;
      }
      function sj(a, b, c, d) {
        null !== d && Jg(d);
        Ug(b, a.child, null, c);
        a = qj(b, b.pendingProps.children);
        a.flags |= 2;
        b.memoizedState = null;
        return a;
      }
      function rj(a, b, c, d, e3, f, g) {
        if (c) {
          if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
          if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
          f = d.fallback;
          e3 = b.mode;
          d = pj({ mode: "visible", children: d.children }, e3, 0, null);
          f = Tg(f, e3, g, null);
          f.flags |= 2;
          d.return = b;
          f.return = b;
          d.sibling = f;
          b.child = d;
          0 !== (b.mode & 1) && Ug(b, a.child, null, g);
          b.child.memoizedState = nj(g);
          b.memoizedState = mj;
          return f;
        }
        if (0 === (b.mode & 1)) return sj(a, b, g, null);
        if ("$!" === e3.data) {
          d = e3.nextSibling && e3.nextSibling.dataset;
          if (d) var h = d.dgst;
          d = h;
          f = Error(p(419));
          d = Ki(f, d, void 0);
          return sj(a, b, g, d);
        }
        h = 0 !== (g & a.childLanes);
        if (dh || h) {
          d = Q;
          if (null !== d) {
            switch (g & -g) {
              case 4:
                e3 = 2;
                break;
              case 16:
                e3 = 8;
                break;
              case 64:
              case 128:
              case 256:
              case 512:
              case 1024:
              case 2048:
              case 4096:
              case 8192:
              case 16384:
              case 32768:
              case 65536:
              case 131072:
              case 262144:
              case 524288:
              case 1048576:
              case 2097152:
              case 4194304:
              case 8388608:
              case 16777216:
              case 33554432:
              case 67108864:
                e3 = 32;
                break;
              case 536870912:
                e3 = 268435456;
                break;
              default:
                e3 = 0;
            }
            e3 = 0 !== (e3 & (d.suspendedLanes | g)) ? 0 : e3;
            0 !== e3 && e3 !== f.retryLane && (f.retryLane = e3, ih(a, e3), gi(d, a, e3, -1));
          }
          tj();
          d = Ki(Error(p(421)));
          return sj(a, b, g, d);
        }
        if ("$?" === e3.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e3._reactRetry = b, null;
        a = f.treeContext;
        yg = Lf(e3.nextSibling);
        xg = b;
        I = true;
        zg = null;
        null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
        b = qj(b, d.children);
        b.flags |= 4096;
        return b;
      }
      function vj(a, b, c) {
        a.lanes |= b;
        var d = a.alternate;
        null !== d && (d.lanes |= b);
        bh(a.return, b, c);
      }
      function wj(a, b, c, d, e3) {
        var f = a.memoizedState;
        null === f ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e3 } : (f.isBackwards = b, f.rendering = null, f.renderingStartTime = 0, f.last = d, f.tail = c, f.tailMode = e3);
      }
      function xj(a, b, c) {
        var d = b.pendingProps, e3 = d.revealOrder, f = d.tail;
        Xi(a, b, d.children, c);
        d = L.current;
        if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
        else {
          if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
            if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
            else if (19 === a.tag) vj(a, c, b);
            else if (null !== a.child) {
              a.child.return = a;
              a = a.child;
              continue;
            }
            if (a === b) break a;
            for (; null === a.sibling; ) {
              if (null === a.return || a.return === b) break a;
              a = a.return;
            }
            a.sibling.return = a.return;
            a = a.sibling;
          }
          d &= 1;
        }
        G(L, d);
        if (0 === (b.mode & 1)) b.memoizedState = null;
        else switch (e3) {
          case "forwards":
            c = b.child;
            for (e3 = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e3 = c), c = c.sibling;
            c = e3;
            null === c ? (e3 = b.child, b.child = null) : (e3 = c.sibling, c.sibling = null);
            wj(b, false, e3, c, f);
            break;
          case "backwards":
            c = null;
            e3 = b.child;
            for (b.child = null; null !== e3; ) {
              a = e3.alternate;
              if (null !== a && null === Ch(a)) {
                b.child = e3;
                break;
              }
              a = e3.sibling;
              e3.sibling = c;
              c = e3;
              e3 = a;
            }
            wj(b, true, c, null, f);
            break;
          case "together":
            wj(b, false, null, null, void 0);
            break;
          default:
            b.memoizedState = null;
        }
        return b.child;
      }
      function ij(a, b) {
        0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
      }
      function Zi(a, b, c) {
        null !== a && (b.dependencies = a.dependencies);
        rh |= b.lanes;
        if (0 === (c & b.childLanes)) return null;
        if (null !== a && b.child !== a.child) throw Error(p(153));
        if (null !== b.child) {
          a = b.child;
          c = Pg(a, a.pendingProps);
          b.child = c;
          for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
          c.sibling = null;
        }
        return b.child;
      }
      function yj(a, b, c) {
        switch (b.tag) {
          case 3:
            kj(b);
            Ig();
            break;
          case 5:
            Ah(b);
            break;
          case 1:
            Zf(b.type) && cg(b);
            break;
          case 4:
            yh(b, b.stateNode.containerInfo);
            break;
          case 10:
            var d = b.type._context, e3 = b.memoizedProps.value;
            G(Wg, d._currentValue);
            d._currentValue = e3;
            break;
          case 13:
            d = b.memoizedState;
            if (null !== d) {
              if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
              if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
              G(L, L.current & 1);
              a = Zi(a, b, c);
              return null !== a ? a.sibling : null;
            }
            G(L, L.current & 1);
            break;
          case 19:
            d = 0 !== (c & b.childLanes);
            if (0 !== (a.flags & 128)) {
              if (d) return xj(a, b, c);
              b.flags |= 128;
            }
            e3 = b.memoizedState;
            null !== e3 && (e3.rendering = null, e3.tail = null, e3.lastEffect = null);
            G(L, L.current);
            if (d) break;
            else return null;
          case 22:
          case 23:
            return b.lanes = 0, dj(a, b, c);
        }
        return Zi(a, b, c);
      }
      var zj;
      var Aj;
      var Bj;
      var Cj;
      zj = function(a, b) {
        for (var c = b.child; null !== c; ) {
          if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
          else if (4 !== c.tag && null !== c.child) {
            c.child.return = c;
            c = c.child;
            continue;
          }
          if (c === b) break;
          for (; null === c.sibling; ) {
            if (null === c.return || c.return === b) return;
            c = c.return;
          }
          c.sibling.return = c.return;
          c = c.sibling;
        }
      };
      Aj = function() {
      };
      Bj = function(a, b, c, d) {
        var e3 = a.memoizedProps;
        if (e3 !== d) {
          a = b.stateNode;
          xh(uh.current);
          var f = null;
          switch (c) {
            case "input":
              e3 = Ya(a, e3);
              d = Ya(a, d);
              f = [];
              break;
            case "select":
              e3 = A({}, e3, { value: void 0 });
              d = A({}, d, { value: void 0 });
              f = [];
              break;
            case "textarea":
              e3 = gb(a, e3);
              d = gb(a, d);
              f = [];
              break;
            default:
              "function" !== typeof e3.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
          }
          ub(c, d);
          var g;
          c = null;
          for (l in e3) if (!d.hasOwnProperty(l) && e3.hasOwnProperty(l) && null != e3[l]) if ("style" === l) {
            var h = e3[l];
            for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
          } else "dangerouslySetInnerHTML" !== l && "children" !== l && "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && "autoFocus" !== l && (ea.hasOwnProperty(l) ? f || (f = []) : (f = f || []).push(l, null));
          for (l in d) {
            var k = d[l];
            h = null != e3 ? e3[l] : void 0;
            if (d.hasOwnProperty(l) && k !== h && (null != k || null != h)) if ("style" === l) if (h) {
              for (g in h) !h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
              for (g in k) k.hasOwnProperty(g) && h[g] !== k[g] && (c || (c = {}), c[g] = k[g]);
            } else c || (f || (f = []), f.push(
              l,
              c
            )), c = k;
            else "dangerouslySetInnerHTML" === l ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f = f || []).push(l, k)) : "children" === l ? "string" !== typeof k && "number" !== typeof k || (f = f || []).push(l, "" + k) : "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && (ea.hasOwnProperty(l) ? (null != k && "onScroll" === l && D("scroll", a), f || h === k || (f = [])) : (f = f || []).push(l, k));
          }
          c && (f = f || []).push("style", c);
          var l = f;
          if (b.updateQueue = l) b.flags |= 4;
        }
      };
      Cj = function(a, b, c, d) {
        c !== d && (b.flags |= 4);
      };
      function Dj(a, b) {
        if (!I) switch (a.tailMode) {
          case "hidden":
            b = a.tail;
            for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
            null === c ? a.tail = null : c.sibling = null;
            break;
          case "collapsed":
            c = a.tail;
            for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
            null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
        }
      }
      function S(a) {
        var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
        if (b) for (var e3 = a.child; null !== e3; ) c |= e3.lanes | e3.childLanes, d |= e3.subtreeFlags & 14680064, d |= e3.flags & 14680064, e3.return = a, e3 = e3.sibling;
        else for (e3 = a.child; null !== e3; ) c |= e3.lanes | e3.childLanes, d |= e3.subtreeFlags, d |= e3.flags, e3.return = a, e3 = e3.sibling;
        a.subtreeFlags |= d;
        a.childLanes = c;
        return b;
      }
      function Ej(a, b, c) {
        var d = b.pendingProps;
        wg(b);
        switch (b.tag) {
          case 2:
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return S(b), null;
          case 1:
            return Zf(b.type) && $f(), S(b), null;
          case 3:
            d = b.stateNode;
            zh();
            E(Wf);
            E(H);
            Eh();
            d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
            if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
            Aj(a, b);
            S(b);
            return null;
          case 5:
            Bh(b);
            var e3 = xh(wh.current);
            c = b.type;
            if (null !== a && null != b.stateNode) Bj(a, b, c, d, e3), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            else {
              if (!d) {
                if (null === b.stateNode) throw Error(p(166));
                S(b);
                return null;
              }
              a = xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.type;
                var f = b.memoizedProps;
                d[Of] = b;
                d[Pf] = f;
                a = 0 !== (b.mode & 1);
                switch (c) {
                  case "dialog":
                    D("cancel", d);
                    D("close", d);
                    break;
                  case "iframe":
                  case "object":
                  case "embed":
                    D("load", d);
                    break;
                  case "video":
                  case "audio":
                    for (e3 = 0; e3 < lf.length; e3++) D(lf[e3], d);
                    break;
                  case "source":
                    D("error", d);
                    break;
                  case "img":
                  case "image":
                  case "link":
                    D(
                      "error",
                      d
                    );
                    D("load", d);
                    break;
                  case "details":
                    D("toggle", d);
                    break;
                  case "input":
                    Za(d, f);
                    D("invalid", d);
                    break;
                  case "select":
                    d._wrapperState = { wasMultiple: !!f.multiple };
                    D("invalid", d);
                    break;
                  case "textarea":
                    hb(d, f), D("invalid", d);
                }
                ub(c, f);
                e3 = null;
                for (var g in f) if (f.hasOwnProperty(g)) {
                  var h = f[g];
                  "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f.suppressHydrationWarning && Af(d.textContent, h, a), e3 = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f.suppressHydrationWarning && Af(
                    d.textContent,
                    h,
                    a
                  ), e3 = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
                }
                switch (c) {
                  case "input":
                    Va(d);
                    db(d, f, true);
                    break;
                  case "textarea":
                    Va(d);
                    jb(d);
                    break;
                  case "select":
                  case "option":
                    break;
                  default:
                    "function" === typeof f.onClick && (d.onclick = Bf);
                }
                d = e3;
                b.updateQueue = d;
                null !== d && (b.flags |= 4);
              } else {
                g = 9 === e3.nodeType ? e3 : e3.ownerDocument;
                "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
                "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
                a[Of] = b;
                a[Pf] = d;
                zj(a, b, false, false);
                b.stateNode = a;
                a: {
                  g = vb(c, d);
                  switch (c) {
                    case "dialog":
                      D("cancel", a);
                      D("close", a);
                      e3 = d;
                      break;
                    case "iframe":
                    case "object":
                    case "embed":
                      D("load", a);
                      e3 = d;
                      break;
                    case "video":
                    case "audio":
                      for (e3 = 0; e3 < lf.length; e3++) D(lf[e3], a);
                      e3 = d;
                      break;
                    case "source":
                      D("error", a);
                      e3 = d;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      D(
                        "error",
                        a
                      );
                      D("load", a);
                      e3 = d;
                      break;
                    case "details":
                      D("toggle", a);
                      e3 = d;
                      break;
                    case "input":
                      Za(a, d);
                      e3 = Ya(a, d);
                      D("invalid", a);
                      break;
                    case "option":
                      e3 = d;
                      break;
                    case "select":
                      a._wrapperState = { wasMultiple: !!d.multiple };
                      e3 = A({}, d, { value: void 0 });
                      D("invalid", a);
                      break;
                    case "textarea":
                      hb(a, d);
                      e3 = gb(a, d);
                      D("invalid", a);
                      break;
                    default:
                      e3 = d;
                  }
                  ub(c, e3);
                  h = e3;
                  for (f in h) if (h.hasOwnProperty(f)) {
                    var k = h[f];
                    "style" === f ? sb(a, k) : "dangerouslySetInnerHTML" === f ? (k = k ? k.__html : void 0, null != k && nb(a, k)) : "children" === f ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a, k) : "number" === typeof k && ob(a, "" + k) : "suppressContentEditableWarning" !== f && "suppressHydrationWarning" !== f && "autoFocus" !== f && (ea.hasOwnProperty(f) ? null != k && "onScroll" === f && D("scroll", a) : null != k && ta(a, f, k, g));
                  }
                  switch (c) {
                    case "input":
                      Va(a);
                      db(a, d, false);
                      break;
                    case "textarea":
                      Va(a);
                      jb(a);
                      break;
                    case "option":
                      null != d.value && a.setAttribute("value", "" + Sa(d.value));
                      break;
                    case "select":
                      a.multiple = !!d.multiple;
                      f = d.value;
                      null != f ? fb(a, !!d.multiple, f, false) : null != d.defaultValue && fb(
                        a,
                        !!d.multiple,
                        d.defaultValue,
                        true
                      );
                      break;
                    default:
                      "function" === typeof e3.onClick && (a.onclick = Bf);
                  }
                  switch (c) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                      d = !!d.autoFocus;
                      break a;
                    case "img":
                      d = true;
                      break a;
                    default:
                      d = false;
                  }
                }
                d && (b.flags |= 4);
              }
              null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            }
            S(b);
            return null;
          case 6:
            if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
            else {
              if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
              c = xh(wh.current);
              xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.memoizedProps;
                d[Of] = b;
                if (f = d.nodeValue !== c) {
                  if (a = xg, null !== a) switch (a.tag) {
                    case 3:
                      Af(d.nodeValue, c, 0 !== (a.mode & 1));
                      break;
                    case 5:
                      true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
                  }
                }
                f && (b.flags |= 4);
              } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
            }
            S(b);
            return null;
          case 13:
            E(L);
            d = b.memoizedState;
            if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
              if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f = false;
              else if (f = Gg(b), null !== d && null !== d.dehydrated) {
                if (null === a) {
                  if (!f) throw Error(p(318));
                  f = b.memoizedState;
                  f = null !== f ? f.dehydrated : null;
                  if (!f) throw Error(p(317));
                  f[Of] = b;
                } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
                S(b);
                f = false;
              } else null !== zg && (Fj(zg), zg = null), f = true;
              if (!f) return b.flags & 65536 ? b : null;
            }
            if (0 !== (b.flags & 128)) return b.lanes = c, b;
            d = null !== d;
            d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
            null !== b.updateQueue && (b.flags |= 4);
            S(b);
            return null;
          case 4:
            return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
          case 10:
            return ah(b.type._context), S(b), null;
          case 17:
            return Zf(b.type) && $f(), S(b), null;
          case 19:
            E(L);
            f = b.memoizedState;
            if (null === f) return S(b), null;
            d = 0 !== (b.flags & 128);
            g = f.rendering;
            if (null === g) if (d) Dj(f, false);
            else {
              if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
                g = Ch(a);
                if (null !== g) {
                  b.flags |= 128;
                  Dj(f, false);
                  d = g.updateQueue;
                  null !== d && (b.updateQueue = d, b.flags |= 4);
                  b.subtreeFlags = 0;
                  d = c;
                  for (c = b.child; null !== c; ) f = c, a = d, f.flags &= 14680066, g = f.alternate, null === g ? (f.childLanes = 0, f.lanes = a, f.child = null, f.subtreeFlags = 0, f.memoizedProps = null, f.memoizedState = null, f.updateQueue = null, f.dependencies = null, f.stateNode = null) : (f.childLanes = g.childLanes, f.lanes = g.lanes, f.child = g.child, f.subtreeFlags = 0, f.deletions = null, f.memoizedProps = g.memoizedProps, f.memoizedState = g.memoizedState, f.updateQueue = g.updateQueue, f.type = g.type, a = g.dependencies, f.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
                  G(L, L.current & 1 | 2);
                  return b.child;
                }
                a = a.sibling;
              }
              null !== f.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
            }
            else {
              if (!d) if (a = Ch(g), null !== a) {
                if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f, true), null === f.tail && "hidden" === f.tailMode && !g.alternate && !I) return S(b), null;
              } else 2 * B() - f.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
              f.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f.last, null !== c ? c.sibling = g : b.child = g, f.last = g);
            }
            if (null !== f.tail) return b = f.tail, f.rendering = b, f.tail = b.sibling, f.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
            S(b);
            return null;
          case 22:
          case 23:
            return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
          case 24:
            return null;
          case 25:
            return null;
        }
        throw Error(p(156, b.tag));
      }
      function Ij(a, b) {
        wg(b);
        switch (b.tag) {
          case 1:
            return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 3:
            return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
          case 5:
            return Bh(b), null;
          case 13:
            E(L);
            a = b.memoizedState;
            if (null !== a && null !== a.dehydrated) {
              if (null === b.alternate) throw Error(p(340));
              Ig();
            }
            a = b.flags;
            return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 19:
            return E(L), null;
          case 4:
            return zh(), null;
          case 10:
            return ah(b.type._context), null;
          case 22:
          case 23:
            return Hj(), null;
          case 24:
            return null;
          default:
            return null;
        }
      }
      var Jj = false;
      var U = false;
      var Kj = "function" === typeof WeakSet ? WeakSet : Set;
      var V = null;
      function Lj(a, b) {
        var c = a.ref;
        if (null !== c) if ("function" === typeof c) try {
          c(null);
        } catch (d) {
          W(a, b, d);
        }
        else c.current = null;
      }
      function Mj(a, b, c) {
        try {
          c();
        } catch (d) {
          W(a, b, d);
        }
      }
      var Nj = false;
      function Oj(a, b) {
        Cf = dd;
        a = Me();
        if (Ne(a)) {
          if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
          else a: {
            c = (c = a.ownerDocument) && c.defaultView || window;
            var d = c.getSelection && c.getSelection();
            if (d && 0 !== d.rangeCount) {
              c = d.anchorNode;
              var e3 = d.anchorOffset, f = d.focusNode;
              d = d.focusOffset;
              try {
                c.nodeType, f.nodeType;
              } catch (F) {
                c = null;
                break a;
              }
              var g = 0, h = -1, k = -1, l = 0, m = 0, q = a, r = null;
              b: for (; ; ) {
                for (var y; ; ) {
                  q !== c || 0 !== e3 && 3 !== q.nodeType || (h = g + e3);
                  q !== f || 0 !== d && 3 !== q.nodeType || (k = g + d);
                  3 === q.nodeType && (g += q.nodeValue.length);
                  if (null === (y = q.firstChild)) break;
                  r = q;
                  q = y;
                }
                for (; ; ) {
                  if (q === a) break b;
                  r === c && ++l === e3 && (h = g);
                  r === f && ++m === d && (k = g);
                  if (null !== (y = q.nextSibling)) break;
                  q = r;
                  r = q.parentNode;
                }
                q = y;
              }
              c = -1 === h || -1 === k ? null : { start: h, end: k };
            } else c = null;
          }
          c = c || { start: 0, end: 0 };
        } else c = null;
        Df = { focusedElem: a, selectionRange: c };
        dd = false;
        for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
        else for (; null !== V; ) {
          b = V;
          try {
            var n = b.alternate;
            if (0 !== (b.flags & 1024)) switch (b.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (null !== n) {
                  var t = n.memoizedProps, J = n.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t : Ci(b.type, t), J);
                  x.__reactInternalSnapshotBeforeUpdate = w;
                }
                break;
              case 3:
                var u = b.stateNode.containerInfo;
                1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(p(163));
            }
          } catch (F) {
            W(b, b.return, F);
          }
          a = b.sibling;
          if (null !== a) {
            a.return = b.return;
            V = a;
            break;
          }
          V = b.return;
        }
        n = Nj;
        Nj = false;
        return n;
      }
      function Pj(a, b, c) {
        var d = b.updateQueue;
        d = null !== d ? d.lastEffect : null;
        if (null !== d) {
          var e3 = d = d.next;
          do {
            if ((e3.tag & a) === a) {
              var f = e3.destroy;
              e3.destroy = void 0;
              void 0 !== f && Mj(b, c, f);
            }
            e3 = e3.next;
          } while (e3 !== d);
        }
      }
      function Qj(a, b) {
        b = b.updateQueue;
        b = null !== b ? b.lastEffect : null;
        if (null !== b) {
          var c = b = b.next;
          do {
            if ((c.tag & a) === a) {
              var d = c.create;
              c.destroy = d();
            }
            c = c.next;
          } while (c !== b);
        }
      }
      function Rj(a) {
        var b = a.ref;
        if (null !== b) {
          var c = a.stateNode;
          switch (a.tag) {
            case 5:
              a = c;
              break;
            default:
              a = c;
          }
          "function" === typeof b ? b(a) : b.current = a;
        }
      }
      function Sj(a) {
        var b = a.alternate;
        null !== b && (a.alternate = null, Sj(b));
        a.child = null;
        a.deletions = null;
        a.sibling = null;
        5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
        a.stateNode = null;
        a.return = null;
        a.dependencies = null;
        a.memoizedProps = null;
        a.memoizedState = null;
        a.pendingProps = null;
        a.stateNode = null;
        a.updateQueue = null;
      }
      function Tj(a) {
        return 5 === a.tag || 3 === a.tag || 4 === a.tag;
      }
      function Uj(a) {
        a: for (; ; ) {
          for (; null === a.sibling; ) {
            if (null === a.return || Tj(a.return)) return null;
            a = a.return;
          }
          a.sibling.return = a.return;
          for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
            if (a.flags & 2) continue a;
            if (null === a.child || 4 === a.tag) continue a;
            else a.child.return = a, a = a.child;
          }
          if (!(a.flags & 2)) return a.stateNode;
        }
      }
      function Vj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
        else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
      }
      function Wj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
        else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
      }
      var X = null;
      var Xj = false;
      function Yj(a, b, c) {
        for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
      }
      function Zj(a, b, c) {
        if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
          lc.onCommitFiberUnmount(kc, c);
        } catch (h) {
        }
        switch (c.tag) {
          case 5:
            U || Lj(c, b);
          case 6:
            var d = X, e3 = Xj;
            X = null;
            Yj(a, b, c);
            X = d;
            Xj = e3;
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
            break;
          case 18:
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
            break;
          case 4:
            d = X;
            e3 = Xj;
            X = c.stateNode.containerInfo;
            Xj = true;
            Yj(a, b, c);
            X = d;
            Xj = e3;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
              e3 = d = d.next;
              do {
                var f = e3, g = f.destroy;
                f = f.tag;
                void 0 !== g && (0 !== (f & 2) ? Mj(c, b, g) : 0 !== (f & 4) && Mj(c, b, g));
                e3 = e3.next;
              } while (e3 !== d);
            }
            Yj(a, b, c);
            break;
          case 1:
            if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
              d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
            } catch (h) {
              W(c, b, h);
            }
            Yj(a, b, c);
            break;
          case 21:
            Yj(a, b, c);
            break;
          case 22:
            c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
            break;
          default:
            Yj(a, b, c);
        }
      }
      function ak(a) {
        var b = a.updateQueue;
        if (null !== b) {
          a.updateQueue = null;
          var c = a.stateNode;
          null === c && (c = a.stateNode = new Kj());
          b.forEach(function(b2) {
            var d = bk.bind(null, a, b2);
            c.has(b2) || (c.add(b2), b2.then(d, d));
          });
        }
      }
      function ck(a, b) {
        var c = b.deletions;
        if (null !== c) for (var d = 0; d < c.length; d++) {
          var e3 = c[d];
          try {
            var f = a, g = b, h = g;
            a: for (; null !== h; ) {
              switch (h.tag) {
                case 5:
                  X = h.stateNode;
                  Xj = false;
                  break a;
                case 3:
                  X = h.stateNode.containerInfo;
                  Xj = true;
                  break a;
                case 4:
                  X = h.stateNode.containerInfo;
                  Xj = true;
                  break a;
              }
              h = h.return;
            }
            if (null === X) throw Error(p(160));
            Zj(f, g, e3);
            X = null;
            Xj = false;
            var k = e3.alternate;
            null !== k && (k.return = null);
            e3.return = null;
          } catch (l) {
            W(e3, b, l);
          }
        }
        if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
      }
      function dk(a, b) {
        var c = a.alternate, d = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            ck(b, a);
            ek(a);
            if (d & 4) {
              try {
                Pj(3, a, a.return), Qj(3, a);
              } catch (t) {
                W(a, a.return, t);
              }
              try {
                Pj(5, a, a.return);
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 1:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            break;
          case 5:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            if (a.flags & 32) {
              var e3 = a.stateNode;
              try {
                ob(e3, "");
              } catch (t) {
                W(a, a.return, t);
              }
            }
            if (d & 4 && (e3 = a.stateNode, null != e3)) {
              var f = a.memoizedProps, g = null !== c ? c.memoizedProps : f, h = a.type, k = a.updateQueue;
              a.updateQueue = null;
              if (null !== k) try {
                "input" === h && "radio" === f.type && null != f.name && ab(e3, f);
                vb(h, g);
                var l = vb(h, f);
                for (g = 0; g < k.length; g += 2) {
                  var m = k[g], q = k[g + 1];
                  "style" === m ? sb(e3, q) : "dangerouslySetInnerHTML" === m ? nb(e3, q) : "children" === m ? ob(e3, q) : ta(e3, m, q, l);
                }
                switch (h) {
                  case "input":
                    bb(e3, f);
                    break;
                  case "textarea":
                    ib(e3, f);
                    break;
                  case "select":
                    var r = e3._wrapperState.wasMultiple;
                    e3._wrapperState.wasMultiple = !!f.multiple;
                    var y = f.value;
                    null != y ? fb(e3, !!f.multiple, y, false) : r !== !!f.multiple && (null != f.defaultValue ? fb(
                      e3,
                      !!f.multiple,
                      f.defaultValue,
                      true
                    ) : fb(e3, !!f.multiple, f.multiple ? [] : "", false));
                }
                e3[Pf] = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 6:
            ck(b, a);
            ek(a);
            if (d & 4) {
              if (null === a.stateNode) throw Error(p(162));
              e3 = a.stateNode;
              f = a.memoizedProps;
              try {
                e3.nodeValue = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 3:
            ck(b, a);
            ek(a);
            if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
              bd(b.containerInfo);
            } catch (t) {
              W(a, a.return, t);
            }
            break;
          case 4:
            ck(b, a);
            ek(a);
            break;
          case 13:
            ck(b, a);
            ek(a);
            e3 = a.child;
            e3.flags & 8192 && (f = null !== e3.memoizedState, e3.stateNode.isHidden = f, !f || null !== e3.alternate && null !== e3.alternate.memoizedState || (fk = B()));
            d & 4 && ak(a);
            break;
          case 22:
            m = null !== c && null !== c.memoizedState;
            a.mode & 1 ? (U = (l = U) || m, ck(b, a), U = l) : ck(b, a);
            ek(a);
            if (d & 8192) {
              l = null !== a.memoizedState;
              if ((a.stateNode.isHidden = l) && !m && 0 !== (a.mode & 1)) for (V = a, m = a.child; null !== m; ) {
                for (q = V = m; null !== V; ) {
                  r = V;
                  y = r.child;
                  switch (r.tag) {
                    case 0:
                    case 11:
                    case 14:
                    case 15:
                      Pj(4, r, r.return);
                      break;
                    case 1:
                      Lj(r, r.return);
                      var n = r.stateNode;
                      if ("function" === typeof n.componentWillUnmount) {
                        d = r;
                        c = r.return;
                        try {
                          b = d, n.props = b.memoizedProps, n.state = b.memoizedState, n.componentWillUnmount();
                        } catch (t) {
                          W(d, c, t);
                        }
                      }
                      break;
                    case 5:
                      Lj(r, r.return);
                      break;
                    case 22:
                      if (null !== r.memoizedState) {
                        gk(q);
                        continue;
                      }
                  }
                  null !== y ? (y.return = r, V = y) : gk(q);
                }
                m = m.sibling;
              }
              a: for (m = null, q = a; ; ) {
                if (5 === q.tag) {
                  if (null === m) {
                    m = q;
                    try {
                      e3 = q.stateNode, l ? (f = e3.style, "function" === typeof f.setProperty ? f.setProperty("display", "none", "important") : f.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                    } catch (t) {
                      W(a, a.return, t);
                    }
                  }
                } else if (6 === q.tag) {
                  if (null === m) try {
                    q.stateNode.nodeValue = l ? "" : q.memoizedProps;
                  } catch (t) {
                    W(a, a.return, t);
                  }
                } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a) && null !== q.child) {
                  q.child.return = q;
                  q = q.child;
                  continue;
                }
                if (q === a) break a;
                for (; null === q.sibling; ) {
                  if (null === q.return || q.return === a) break a;
                  m === q && (m = null);
                  q = q.return;
                }
                m === q && (m = null);
                q.sibling.return = q.return;
                q = q.sibling;
              }
            }
            break;
          case 19:
            ck(b, a);
            ek(a);
            d & 4 && ak(a);
            break;
          case 21:
            break;
          default:
            ck(
              b,
              a
            ), ek(a);
        }
      }
      function ek(a) {
        var b = a.flags;
        if (b & 2) {
          try {
            a: {
              for (var c = a.return; null !== c; ) {
                if (Tj(c)) {
                  var d = c;
                  break a;
                }
                c = c.return;
              }
              throw Error(p(160));
            }
            switch (d.tag) {
              case 5:
                var e3 = d.stateNode;
                d.flags & 32 && (ob(e3, ""), d.flags &= -33);
                var f = Uj(a);
                Wj(a, f, e3);
                break;
              case 3:
              case 4:
                var g = d.stateNode.containerInfo, h = Uj(a);
                Vj(a, h, g);
                break;
              default:
                throw Error(p(161));
            }
          } catch (k) {
            W(a, a.return, k);
          }
          a.flags &= -3;
        }
        b & 4096 && (a.flags &= -4097);
      }
      function hk(a, b, c) {
        V = a;
        ik(a, b, c);
      }
      function ik(a, b, c) {
        for (var d = 0 !== (a.mode & 1); null !== V; ) {
          var e3 = V, f = e3.child;
          if (22 === e3.tag && d) {
            var g = null !== e3.memoizedState || Jj;
            if (!g) {
              var h = e3.alternate, k = null !== h && null !== h.memoizedState || U;
              h = Jj;
              var l = U;
              Jj = g;
              if ((U = k) && !l) for (V = e3; null !== V; ) g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e3) : null !== k ? (k.return = g, V = k) : jk(e3);
              for (; null !== f; ) V = f, ik(f, b, c), f = f.sibling;
              V = e3;
              Jj = h;
              U = l;
            }
            kk(a, b, c);
          } else 0 !== (e3.subtreeFlags & 8772) && null !== f ? (f.return = e3, V = f) : kk(a, b, c);
        }
      }
      function kk(a) {
        for (; null !== V; ) {
          var b = V;
          if (0 !== (b.flags & 8772)) {
            var c = b.alternate;
            try {
              if (0 !== (b.flags & 8772)) switch (b.tag) {
                case 0:
                case 11:
                case 15:
                  U || Qj(5, b);
                  break;
                case 1:
                  var d = b.stateNode;
                  if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
                  else {
                    var e3 = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
                    d.componentDidUpdate(e3, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
                  }
                  var f = b.updateQueue;
                  null !== f && sh(b, f, d);
                  break;
                case 3:
                  var g = b.updateQueue;
                  if (null !== g) {
                    c = null;
                    if (null !== b.child) switch (b.child.tag) {
                      case 5:
                        c = b.child.stateNode;
                        break;
                      case 1:
                        c = b.child.stateNode;
                    }
                    sh(b, g, c);
                  }
                  break;
                case 5:
                  var h = b.stateNode;
                  if (null === c && b.flags & 4) {
                    c = h;
                    var k = b.memoizedProps;
                    switch (b.type) {
                      case "button":
                      case "input":
                      case "select":
                      case "textarea":
                        k.autoFocus && c.focus();
                        break;
                      case "img":
                        k.src && (c.src = k.src);
                    }
                  }
                  break;
                case 6:
                  break;
                case 4:
                  break;
                case 12:
                  break;
                case 13:
                  if (null === b.memoizedState) {
                    var l = b.alternate;
                    if (null !== l) {
                      var m = l.memoizedState;
                      if (null !== m) {
                        var q = m.dehydrated;
                        null !== q && bd(q);
                      }
                    }
                  }
                  break;
                case 19:
                case 17:
                case 21:
                case 22:
                case 23:
                case 25:
                  break;
                default:
                  throw Error(p(163));
              }
              U || b.flags & 512 && Rj(b);
            } catch (r) {
              W(b, b.return, r);
            }
          }
          if (b === a) {
            V = null;
            break;
          }
          c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function gk(a) {
        for (; null !== V; ) {
          var b = V;
          if (b === a) {
            V = null;
            break;
          }
          var c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function jk(a) {
        for (; null !== V; ) {
          var b = V;
          try {
            switch (b.tag) {
              case 0:
              case 11:
              case 15:
                var c = b.return;
                try {
                  Qj(4, b);
                } catch (k) {
                  W(b, c, k);
                }
                break;
              case 1:
                var d = b.stateNode;
                if ("function" === typeof d.componentDidMount) {
                  var e3 = b.return;
                  try {
                    d.componentDidMount();
                  } catch (k) {
                    W(b, e3, k);
                  }
                }
                var f = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, f, k);
                }
                break;
              case 5:
                var g = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, g, k);
                }
            }
          } catch (k) {
            W(b, b.return, k);
          }
          if (b === a) {
            V = null;
            break;
          }
          var h = b.sibling;
          if (null !== h) {
            h.return = b.return;
            V = h;
            break;
          }
          V = b.return;
        }
      }
      var lk = Math.ceil;
      var mk = ua.ReactCurrentDispatcher;
      var nk = ua.ReactCurrentOwner;
      var ok = ua.ReactCurrentBatchConfig;
      var K = 0;
      var Q = null;
      var Y = null;
      var Z = 0;
      var fj = 0;
      var ej = Uf(0);
      var T = 0;
      var pk = null;
      var rh = 0;
      var qk = 0;
      var rk = 0;
      var sk = null;
      var tk = null;
      var fk = 0;
      var Gj = Infinity;
      var uk = null;
      var Oi = false;
      var Pi = null;
      var Ri = null;
      var vk = false;
      var wk = null;
      var xk = 0;
      var yk = 0;
      var zk = null;
      var Ak = -1;
      var Bk = 0;
      function R() {
        return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
      }
      function yi(a) {
        if (0 === (a.mode & 1)) return 1;
        if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
        if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
        a = C;
        if (0 !== a) return a;
        a = window.event;
        a = void 0 === a ? 16 : jd(a.type);
        return a;
      }
      function gi(a, b, c, d) {
        if (50 < yk) throw yk = 0, zk = null, Error(p(185));
        Ac(a, c, d);
        if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
      }
      function Dk(a, b) {
        var c = a.callbackNode;
        wc(a, b);
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
        else if (b = d & -d, a.callbackPriority !== b) {
          null != c && bc(c);
          if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
            0 === (K & 6) && jg();
          }), c = null;
          else {
            switch (Dc(d)) {
              case 1:
                c = fc;
                break;
              case 4:
                c = gc;
                break;
              case 16:
                c = hc;
                break;
              case 536870912:
                c = jc;
                break;
              default:
                c = hc;
            }
            c = Fk(c, Gk.bind(null, a));
          }
          a.callbackPriority = b;
          a.callbackNode = c;
        }
      }
      function Gk(a, b) {
        Ak = -1;
        Bk = 0;
        if (0 !== (K & 6)) throw Error(p(327));
        var c = a.callbackNode;
        if (Hk() && a.callbackNode !== c) return null;
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d) return null;
        if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
        else {
          b = d;
          var e3 = K;
          K |= 2;
          var f = Jk();
          if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
          do
            try {
              Lk();
              break;
            } catch (h) {
              Mk(a, h);
            }
          while (1);
          $g();
          mk.current = f;
          K = e3;
          null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
        }
        if (0 !== b) {
          2 === b && (e3 = xc(a), 0 !== e3 && (d = e3, b = Nk(a, e3)));
          if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
          if (6 === b) Ck(a, d);
          else {
            e3 = a.current.alternate;
            if (0 === (d & 30) && !Ok(e3) && (b = Ik(a, d), 2 === b && (f = xc(a), 0 !== f && (d = f, b = Nk(a, f))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
            a.finishedWork = e3;
            a.finishedLanes = d;
            switch (b) {
              case 0:
              case 1:
                throw Error(p(345));
              case 2:
                Pk(a, tk, uk);
                break;
              case 3:
                Ck(a, d);
                if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
                  if (0 !== uc(a, 0)) break;
                  e3 = a.suspendedLanes;
                  if ((e3 & d) !== d) {
                    R();
                    a.pingedLanes |= a.suspendedLanes & e3;
                    break;
                  }
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 4:
                Ck(a, d);
                if ((d & 4194240) === d) break;
                b = a.eventTimes;
                for (e3 = -1; 0 < d; ) {
                  var g = 31 - oc(d);
                  f = 1 << g;
                  g = b[g];
                  g > e3 && (e3 = g);
                  d &= ~f;
                }
                d = e3;
                d = B() - d;
                d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
                if (10 < d) {
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 5:
                Pk(a, tk, uk);
                break;
              default:
                throw Error(p(329));
            }
          }
        }
        Dk(a, B());
        return a.callbackNode === c ? Gk.bind(null, a) : null;
      }
      function Nk(a, b) {
        var c = sk;
        a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
        a = Ik(a, b);
        2 !== a && (b = tk, tk = c, null !== b && Fj(b));
        return a;
      }
      function Fj(a) {
        null === tk ? tk = a : tk.push.apply(tk, a);
      }
      function Ok(a) {
        for (var b = a; ; ) {
          if (b.flags & 16384) {
            var c = b.updateQueue;
            if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
              var e3 = c[d], f = e3.getSnapshot;
              e3 = e3.value;
              try {
                if (!He(f(), e3)) return false;
              } catch (g) {
                return false;
              }
            }
          }
          c = b.child;
          if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
          else {
            if (b === a) break;
            for (; null === b.sibling; ) {
              if (null === b.return || b.return === a) return true;
              b = b.return;
            }
            b.sibling.return = b.return;
            b = b.sibling;
          }
        }
        return true;
      }
      function Ck(a, b) {
        b &= ~rk;
        b &= ~qk;
        a.suspendedLanes |= b;
        a.pingedLanes &= ~b;
        for (a = a.expirationTimes; 0 < b; ) {
          var c = 31 - oc(b), d = 1 << c;
          a[c] = -1;
          b &= ~d;
        }
      }
      function Ek(a) {
        if (0 !== (K & 6)) throw Error(p(327));
        Hk();
        var b = uc(a, 0);
        if (0 === (b & 1)) return Dk(a, B()), null;
        var c = Ik(a, b);
        if (0 !== a.tag && 2 === c) {
          var d = xc(a);
          0 !== d && (b = d, c = Nk(a, d));
        }
        if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
        if (6 === c) throw Error(p(345));
        a.finishedWork = a.current.alternate;
        a.finishedLanes = b;
        Pk(a, tk, uk);
        Dk(a, B());
        return null;
      }
      function Qk(a, b) {
        var c = K;
        K |= 1;
        try {
          return a(b);
        } finally {
          K = c, 0 === K && (Gj = B() + 500, fg && jg());
        }
      }
      function Rk(a) {
        null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
        var b = K;
        K |= 1;
        var c = ok.transition, d = C;
        try {
          if (ok.transition = null, C = 1, a) return a();
        } finally {
          C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
        }
      }
      function Hj() {
        fj = ej.current;
        E(ej);
      }
      function Kk(a, b) {
        a.finishedWork = null;
        a.finishedLanes = 0;
        var c = a.timeoutHandle;
        -1 !== c && (a.timeoutHandle = -1, Gf(c));
        if (null !== Y) for (c = Y.return; null !== c; ) {
          var d = c;
          wg(d);
          switch (d.tag) {
            case 1:
              d = d.type.childContextTypes;
              null !== d && void 0 !== d && $f();
              break;
            case 3:
              zh();
              E(Wf);
              E(H);
              Eh();
              break;
            case 5:
              Bh(d);
              break;
            case 4:
              zh();
              break;
            case 13:
              E(L);
              break;
            case 19:
              E(L);
              break;
            case 10:
              ah(d.type._context);
              break;
            case 22:
            case 23:
              Hj();
          }
          c = c.return;
        }
        Q = a;
        Y = a = Pg(a.current, null);
        Z = fj = b;
        T = 0;
        pk = null;
        rk = qk = rh = 0;
        tk = sk = null;
        if (null !== fh) {
          for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
            c.interleaved = null;
            var e3 = d.next, f = c.pending;
            if (null !== f) {
              var g = f.next;
              f.next = e3;
              d.next = g;
            }
            c.pending = d;
          }
          fh = null;
        }
        return a;
      }
      function Mk(a, b) {
        do {
          var c = Y;
          try {
            $g();
            Fh.current = Rh;
            if (Ih) {
              for (var d = M.memoizedState; null !== d; ) {
                var e3 = d.queue;
                null !== e3 && (e3.pending = null);
                d = d.next;
              }
              Ih = false;
            }
            Hh = 0;
            O = N = M = null;
            Jh = false;
            Kh = 0;
            nk.current = null;
            if (null === c || null === c.return) {
              T = 1;
              pk = b;
              Y = null;
              break;
            }
            a: {
              var f = a, g = c.return, h = c, k = b;
              b = Z;
              h.flags |= 32768;
              if (null !== k && "object" === typeof k && "function" === typeof k.then) {
                var l = k, m = h, q = m.tag;
                if (0 === (m.mode & 1) && (0 === q || 11 === q || 15 === q)) {
                  var r = m.alternate;
                  r ? (m.updateQueue = r.updateQueue, m.memoizedState = r.memoizedState, m.lanes = r.lanes) : (m.updateQueue = null, m.memoizedState = null);
                }
                var y = Ui(g);
                if (null !== y) {
                  y.flags &= -257;
                  Vi(y, g, h, f, b);
                  y.mode & 1 && Si(f, l, b);
                  b = y;
                  k = l;
                  var n = b.updateQueue;
                  if (null === n) {
                    var t = /* @__PURE__ */ new Set();
                    t.add(k);
                    b.updateQueue = t;
                  } else n.add(k);
                  break a;
                } else {
                  if (0 === (b & 1)) {
                    Si(f, l, b);
                    tj();
                    break a;
                  }
                  k = Error(p(426));
                }
              } else if (I && h.mode & 1) {
                var J = Ui(g);
                if (null !== J) {
                  0 === (J.flags & 65536) && (J.flags |= 256);
                  Vi(J, g, h, f, b);
                  Jg(Ji(k, h));
                  break a;
                }
              }
              f = k = Ji(k, h);
              4 !== T && (T = 2);
              null === sk ? sk = [f] : sk.push(f);
              f = g;
              do {
                switch (f.tag) {
                  case 3:
                    f.flags |= 65536;
                    b &= -b;
                    f.lanes |= b;
                    var x = Ni(f, k, b);
                    ph(f, x);
                    break a;
                  case 1:
                    h = k;
                    var w = f.type, u = f.stateNode;
                    if (0 === (f.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                      f.flags |= 65536;
                      b &= -b;
                      f.lanes |= b;
                      var F = Qi(f, h, b);
                      ph(f, F);
                      break a;
                    }
                }
                f = f.return;
              } while (null !== f);
            }
            Sk(c);
          } catch (na) {
            b = na;
            Y === c && null !== c && (Y = c = c.return);
            continue;
          }
          break;
        } while (1);
      }
      function Jk() {
        var a = mk.current;
        mk.current = Rh;
        return null === a ? Rh : a;
      }
      function tj() {
        if (0 === T || 3 === T || 2 === T) T = 4;
        null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
      }
      function Ik(a, b) {
        var c = K;
        K |= 2;
        var d = Jk();
        if (Q !== a || Z !== b) uk = null, Kk(a, b);
        do
          try {
            Tk();
            break;
          } catch (e3) {
            Mk(a, e3);
          }
        while (1);
        $g();
        K = c;
        mk.current = d;
        if (null !== Y) throw Error(p(261));
        Q = null;
        Z = 0;
        return T;
      }
      function Tk() {
        for (; null !== Y; ) Uk(Y);
      }
      function Lk() {
        for (; null !== Y && !cc(); ) Uk(Y);
      }
      function Uk(a) {
        var b = Vk(a.alternate, a, fj);
        a.memoizedProps = a.pendingProps;
        null === b ? Sk(a) : Y = b;
        nk.current = null;
      }
      function Sk(a) {
        var b = a;
        do {
          var c = b.alternate;
          a = b.return;
          if (0 === (b.flags & 32768)) {
            if (c = Ej(c, b, fj), null !== c) {
              Y = c;
              return;
            }
          } else {
            c = Ij(c, b);
            if (null !== c) {
              c.flags &= 32767;
              Y = c;
              return;
            }
            if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
            else {
              T = 6;
              Y = null;
              return;
            }
          }
          b = b.sibling;
          if (null !== b) {
            Y = b;
            return;
          }
          Y = b = a;
        } while (null !== b);
        0 === T && (T = 5);
      }
      function Pk(a, b, c) {
        var d = C, e3 = ok.transition;
        try {
          ok.transition = null, C = 1, Wk(a, b, c, d);
        } finally {
          ok.transition = e3, C = d;
        }
        return null;
      }
      function Wk(a, b, c, d) {
        do
          Hk();
        while (null !== wk);
        if (0 !== (K & 6)) throw Error(p(327));
        c = a.finishedWork;
        var e3 = a.finishedLanes;
        if (null === c) return null;
        a.finishedWork = null;
        a.finishedLanes = 0;
        if (c === a.current) throw Error(p(177));
        a.callbackNode = null;
        a.callbackPriority = 0;
        var f = c.lanes | c.childLanes;
        Bc(a, f);
        a === Q && (Y = Q = null, Z = 0);
        0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
          Hk();
          return null;
        }));
        f = 0 !== (c.flags & 15990);
        if (0 !== (c.subtreeFlags & 15990) || f) {
          f = ok.transition;
          ok.transition = null;
          var g = C;
          C = 1;
          var h = K;
          K |= 4;
          nk.current = null;
          Oj(a, c);
          dk(c, a);
          Oe(Df);
          dd = !!Cf;
          Df = Cf = null;
          a.current = c;
          hk(c, a, e3);
          dc();
          K = h;
          C = g;
          ok.transition = f;
        } else a.current = c;
        vk && (vk = false, wk = a, xk = e3);
        f = a.pendingLanes;
        0 === f && (Ri = null);
        mc(c.stateNode, d);
        Dk(a, B());
        if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e3 = b[c], d(e3.value, { componentStack: e3.stack, digest: e3.digest });
        if (Oi) throw Oi = false, a = Pi, Pi = null, a;
        0 !== (xk & 1) && 0 !== a.tag && Hk();
        f = a.pendingLanes;
        0 !== (f & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
        jg();
        return null;
      }
      function Hk() {
        if (null !== wk) {
          var a = Dc(xk), b = ok.transition, c = C;
          try {
            ok.transition = null;
            C = 16 > a ? 16 : a;
            if (null === wk) var d = false;
            else {
              a = wk;
              wk = null;
              xk = 0;
              if (0 !== (K & 6)) throw Error(p(331));
              var e3 = K;
              K |= 4;
              for (V = a.current; null !== V; ) {
                var f = V, g = f.child;
                if (0 !== (V.flags & 16)) {
                  var h = f.deletions;
                  if (null !== h) {
                    for (var k = 0; k < h.length; k++) {
                      var l = h[k];
                      for (V = l; null !== V; ) {
                        var m = V;
                        switch (m.tag) {
                          case 0:
                          case 11:
                          case 15:
                            Pj(8, m, f);
                        }
                        var q = m.child;
                        if (null !== q) q.return = m, V = q;
                        else for (; null !== V; ) {
                          m = V;
                          var r = m.sibling, y = m.return;
                          Sj(m);
                          if (m === l) {
                            V = null;
                            break;
                          }
                          if (null !== r) {
                            r.return = y;
                            V = r;
                            break;
                          }
                          V = y;
                        }
                      }
                    }
                    var n = f.alternate;
                    if (null !== n) {
                      var t = n.child;
                      if (null !== t) {
                        n.child = null;
                        do {
                          var J = t.sibling;
                          t.sibling = null;
                          t = J;
                        } while (null !== t);
                      }
                    }
                    V = f;
                  }
                }
                if (0 !== (f.subtreeFlags & 2064) && null !== g) g.return = f, V = g;
                else b: for (; null !== V; ) {
                  f = V;
                  if (0 !== (f.flags & 2048)) switch (f.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(9, f, f.return);
                  }
                  var x = f.sibling;
                  if (null !== x) {
                    x.return = f.return;
                    V = x;
                    break b;
                  }
                  V = f.return;
                }
              }
              var w = a.current;
              for (V = w; null !== V; ) {
                g = V;
                var u = g.child;
                if (0 !== (g.subtreeFlags & 2064) && null !== u) u.return = g, V = u;
                else b: for (g = w; null !== V; ) {
                  h = V;
                  if (0 !== (h.flags & 2048)) try {
                    switch (h.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Qj(9, h);
                    }
                  } catch (na) {
                    W(h, h.return, na);
                  }
                  if (h === g) {
                    V = null;
                    break b;
                  }
                  var F = h.sibling;
                  if (null !== F) {
                    F.return = h.return;
                    V = F;
                    break b;
                  }
                  V = h.return;
                }
              }
              K = e3;
              jg();
              if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
                lc.onPostCommitFiberRoot(kc, a);
              } catch (na) {
              }
              d = true;
            }
            return d;
          } finally {
            C = c, ok.transition = b;
          }
        }
        return false;
      }
      function Xk(a, b, c) {
        b = Ji(c, b);
        b = Ni(a, b, 1);
        a = nh(a, b, 1);
        b = R();
        null !== a && (Ac(a, 1, b), Dk(a, b));
      }
      function W(a, b, c) {
        if (3 === a.tag) Xk(a, a, c);
        else for (; null !== b; ) {
          if (3 === b.tag) {
            Xk(b, a, c);
            break;
          } else if (1 === b.tag) {
            var d = b.stateNode;
            if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
              a = Ji(c, a);
              a = Qi(b, a, 1);
              b = nh(b, a, 1);
              a = R();
              null !== b && (Ac(b, 1, a), Dk(b, a));
              break;
            }
          }
          b = b.return;
        }
      }
      function Ti(a, b, c) {
        var d = a.pingCache;
        null !== d && d.delete(b);
        b = R();
        a.pingedLanes |= a.suspendedLanes & c;
        Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
        Dk(a, b);
      }
      function Yk(a, b) {
        0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
        var c = R();
        a = ih(a, b);
        null !== a && (Ac(a, b, c), Dk(a, c));
      }
      function uj(a) {
        var b = a.memoizedState, c = 0;
        null !== b && (c = b.retryLane);
        Yk(a, c);
      }
      function bk(a, b) {
        var c = 0;
        switch (a.tag) {
          case 13:
            var d = a.stateNode;
            var e3 = a.memoizedState;
            null !== e3 && (c = e3.retryLane);
            break;
          case 19:
            d = a.stateNode;
            break;
          default:
            throw Error(p(314));
        }
        null !== d && d.delete(b);
        Yk(a, c);
      }
      var Vk;
      Vk = function(a, b, c) {
        if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
        else {
          if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
          dh = 0 !== (a.flags & 131072) ? true : false;
        }
        else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
        b.lanes = 0;
        switch (b.tag) {
          case 2:
            var d = b.type;
            ij(a, b);
            a = b.pendingProps;
            var e3 = Yf(b, H.current);
            ch(b, c);
            e3 = Nh(null, b, d, a, e3, c);
            var f = Sh();
            b.flags |= 1;
            "object" === typeof e3 && null !== e3 && "function" === typeof e3.render && void 0 === e3.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f = true, cg(b)) : f = false, b.memoizedState = null !== e3.state && void 0 !== e3.state ? e3.state : null, kh(b), e3.updater = Ei, b.stateNode = e3, e3._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f, c)) : (b.tag = 0, I && f && vg(b), Xi(null, b, e3, c), b = b.child);
            return b;
          case 16:
            d = b.elementType;
            a: {
              ij(a, b);
              a = b.pendingProps;
              e3 = d._init;
              d = e3(d._payload);
              b.type = d;
              e3 = b.tag = Zk(d);
              a = Ci(d, a);
              switch (e3) {
                case 0:
                  b = cj(null, b, d, a, c);
                  break a;
                case 1:
                  b = hj(null, b, d, a, c);
                  break a;
                case 11:
                  b = Yi(null, b, d, a, c);
                  break a;
                case 14:
                  b = $i(null, b, d, Ci(d.type, a), c);
                  break a;
              }
              throw Error(p(
                306,
                d,
                ""
              ));
            }
            return b;
          case 0:
            return d = b.type, e3 = b.pendingProps, e3 = b.elementType === d ? e3 : Ci(d, e3), cj(a, b, d, e3, c);
          case 1:
            return d = b.type, e3 = b.pendingProps, e3 = b.elementType === d ? e3 : Ci(d, e3), hj(a, b, d, e3, c);
          case 3:
            a: {
              kj(b);
              if (null === a) throw Error(p(387));
              d = b.pendingProps;
              f = b.memoizedState;
              e3 = f.element;
              lh(a, b);
              qh(b, d, null, c);
              var g = b.memoizedState;
              d = g.element;
              if (f.isDehydrated) if (f = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f, b.memoizedState = f, b.flags & 256) {
                e3 = Ji(Error(p(423)), b);
                b = lj(a, b, d, c, e3);
                break a;
              } else if (d !== e3) {
                e3 = Ji(Error(p(424)), b);
                b = lj(a, b, d, c, e3);
                break a;
              } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
              else {
                Ig();
                if (d === e3) {
                  b = Zi(a, b, c);
                  break a;
                }
                Xi(a, b, d, c);
              }
              b = b.child;
            }
            return b;
          case 5:
            return Ah(b), null === a && Eg(b), d = b.type, e3 = b.pendingProps, f = null !== a ? a.memoizedProps : null, g = e3.children, Ef(d, e3) ? g = null : null !== f && Ef(d, f) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
          case 6:
            return null === a && Eg(b), null;
          case 13:
            return oj(a, b, c);
          case 4:
            return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
          case 11:
            return d = b.type, e3 = b.pendingProps, e3 = b.elementType === d ? e3 : Ci(d, e3), Yi(a, b, d, e3, c);
          case 7:
            return Xi(a, b, b.pendingProps, c), b.child;
          case 8:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 12:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 10:
            a: {
              d = b.type._context;
              e3 = b.pendingProps;
              f = b.memoizedProps;
              g = e3.value;
              G(Wg, d._currentValue);
              d._currentValue = g;
              if (null !== f) if (He(f.value, g)) {
                if (f.children === e3.children && !Wf.current) {
                  b = Zi(a, b, c);
                  break a;
                }
              } else for (f = b.child, null !== f && (f.return = b); null !== f; ) {
                var h = f.dependencies;
                if (null !== h) {
                  g = f.child;
                  for (var k = h.firstContext; null !== k; ) {
                    if (k.context === d) {
                      if (1 === f.tag) {
                        k = mh(-1, c & -c);
                        k.tag = 2;
                        var l = f.updateQueue;
                        if (null !== l) {
                          l = l.shared;
                          var m = l.pending;
                          null === m ? k.next = k : (k.next = m.next, m.next = k);
                          l.pending = k;
                        }
                      }
                      f.lanes |= c;
                      k = f.alternate;
                      null !== k && (k.lanes |= c);
                      bh(
                        f.return,
                        c,
                        b
                      );
                      h.lanes |= c;
                      break;
                    }
                    k = k.next;
                  }
                } else if (10 === f.tag) g = f.type === b.type ? null : f.child;
                else if (18 === f.tag) {
                  g = f.return;
                  if (null === g) throw Error(p(341));
                  g.lanes |= c;
                  h = g.alternate;
                  null !== h && (h.lanes |= c);
                  bh(g, c, b);
                  g = f.sibling;
                } else g = f.child;
                if (null !== g) g.return = f;
                else for (g = f; null !== g; ) {
                  if (g === b) {
                    g = null;
                    break;
                  }
                  f = g.sibling;
                  if (null !== f) {
                    f.return = g.return;
                    g = f;
                    break;
                  }
                  g = g.return;
                }
                f = g;
              }
              Xi(a, b, e3.children, c);
              b = b.child;
            }
            return b;
          case 9:
            return e3 = b.type, d = b.pendingProps.children, ch(b, c), e3 = eh(e3), d = d(e3), b.flags |= 1, Xi(a, b, d, c), b.child;
          case 14:
            return d = b.type, e3 = Ci(d, b.pendingProps), e3 = Ci(d.type, e3), $i(a, b, d, e3, c);
          case 15:
            return bj(a, b, b.type, b.pendingProps, c);
          case 17:
            return d = b.type, e3 = b.pendingProps, e3 = b.elementType === d ? e3 : Ci(d, e3), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e3), Ii(b, d, e3, c), jj(null, b, d, true, a, c);
          case 19:
            return xj(a, b, c);
          case 22:
            return dj(a, b, c);
        }
        throw Error(p(156, b.tag));
      };
      function Fk(a, b) {
        return ac(a, b);
      }
      function $k(a, b, c, d) {
        this.tag = a;
        this.key = c;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.ref = null;
        this.pendingProps = b;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = d;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
      }
      function Bg(a, b, c, d) {
        return new $k(a, b, c, d);
      }
      function aj(a) {
        a = a.prototype;
        return !(!a || !a.isReactComponent);
      }
      function Zk(a) {
        if ("function" === typeof a) return aj(a) ? 1 : 0;
        if (void 0 !== a && null !== a) {
          a = a.$$typeof;
          if (a === Da) return 11;
          if (a === Ga) return 14;
        }
        return 2;
      }
      function Pg(a, b) {
        var c = a.alternate;
        null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
        c.flags = a.flags & 14680064;
        c.childLanes = a.childLanes;
        c.lanes = a.lanes;
        c.child = a.child;
        c.memoizedProps = a.memoizedProps;
        c.memoizedState = a.memoizedState;
        c.updateQueue = a.updateQueue;
        b = a.dependencies;
        c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
        c.sibling = a.sibling;
        c.index = a.index;
        c.ref = a.ref;
        return c;
      }
      function Rg(a, b, c, d, e3, f) {
        var g = 2;
        d = a;
        if ("function" === typeof a) aj(a) && (g = 1);
        else if ("string" === typeof a) g = 5;
        else a: switch (a) {
          case ya:
            return Tg(c.children, e3, f, b);
          case za:
            g = 8;
            e3 |= 8;
            break;
          case Aa:
            return a = Bg(12, c, b, e3 | 2), a.elementType = Aa, a.lanes = f, a;
          case Ea:
            return a = Bg(13, c, b, e3), a.elementType = Ea, a.lanes = f, a;
          case Fa:
            return a = Bg(19, c, b, e3), a.elementType = Fa, a.lanes = f, a;
          case Ia:
            return pj(c, e3, f, b);
          default:
            if ("object" === typeof a && null !== a) switch (a.$$typeof) {
              case Ba:
                g = 10;
                break a;
              case Ca:
                g = 9;
                break a;
              case Da:
                g = 11;
                break a;
              case Ga:
                g = 14;
                break a;
              case Ha:
                g = 16;
                d = null;
                break a;
            }
            throw Error(p(130, null == a ? a : typeof a, ""));
        }
        b = Bg(g, c, b, e3);
        b.elementType = a;
        b.type = d;
        b.lanes = f;
        return b;
      }
      function Tg(a, b, c, d) {
        a = Bg(7, a, d, b);
        a.lanes = c;
        return a;
      }
      function pj(a, b, c, d) {
        a = Bg(22, a, d, b);
        a.elementType = Ia;
        a.lanes = c;
        a.stateNode = { isHidden: false };
        return a;
      }
      function Qg(a, b, c) {
        a = Bg(6, a, null, b);
        a.lanes = c;
        return a;
      }
      function Sg(a, b, c) {
        b = Bg(4, null !== a.children ? a.children : [], a.key, b);
        b.lanes = c;
        b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
        return b;
      }
      function al(a, b, c, d, e3) {
        this.tag = b;
        this.containerInfo = a;
        this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
        this.timeoutHandle = -1;
        this.callbackNode = this.pendingContext = this.context = null;
        this.callbackPriority = 0;
        this.eventTimes = zc(0);
        this.expirationTimes = zc(-1);
        this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
        this.entanglements = zc(0);
        this.identifierPrefix = d;
        this.onRecoverableError = e3;
        this.mutableSourceEagerHydrationData = null;
      }
      function bl(a, b, c, d, e3, f, g, h, k) {
        a = new al(a, b, c, h, k);
        1 === b ? (b = 1, true === f && (b |= 8)) : b = 0;
        f = Bg(3, null, null, b);
        a.current = f;
        f.stateNode = a;
        f.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
        kh(f);
        return a;
      }
      function cl(a, b, c) {
        var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
      }
      function dl(a) {
        if (!a) return Vf;
        a = a._reactInternals;
        a: {
          if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
          var b = a;
          do {
            switch (b.tag) {
              case 3:
                b = b.stateNode.context;
                break a;
              case 1:
                if (Zf(b.type)) {
                  b = b.stateNode.__reactInternalMemoizedMergedChildContext;
                  break a;
                }
            }
            b = b.return;
          } while (null !== b);
          throw Error(p(171));
        }
        if (1 === a.tag) {
          var c = a.type;
          if (Zf(c)) return bg(a, c, b);
        }
        return b;
      }
      function el2(a, b, c, d, e3, f, g, h, k) {
        a = bl(c, d, true, a, e3, f, g, h, k);
        a.context = dl(null);
        c = a.current;
        d = R();
        e3 = yi(c);
        f = mh(d, e3);
        f.callback = void 0 !== b && null !== b ? b : null;
        nh(c, f, e3);
        a.current.lanes = e3;
        Ac(a, e3, d);
        Dk(a, d);
        return a;
      }
      function fl(a, b, c, d) {
        var e3 = b.current, f = R(), g = yi(e3);
        c = dl(c);
        null === b.context ? b.context = c : b.pendingContext = c;
        b = mh(f, g);
        b.payload = { element: a };
        d = void 0 === d ? null : d;
        null !== d && (b.callback = d);
        a = nh(e3, b, g);
        null !== a && (gi(a, e3, g, f), oh(a, e3, g));
        return g;
      }
      function gl(a) {
        a = a.current;
        if (!a.child) return null;
        switch (a.child.tag) {
          case 5:
            return a.child.stateNode;
          default:
            return a.child.stateNode;
        }
      }
      function hl(a, b) {
        a = a.memoizedState;
        if (null !== a && null !== a.dehydrated) {
          var c = a.retryLane;
          a.retryLane = 0 !== c && c < b ? c : b;
        }
      }
      function il(a, b) {
        hl(a, b);
        (a = a.alternate) && hl(a, b);
      }
      function jl() {
        return null;
      }
      var kl = "function" === typeof reportError ? reportError : function(a) {
        console.error(a);
      };
      function ll(a) {
        this._internalRoot = a;
      }
      ml.prototype.render = ll.prototype.render = function(a) {
        var b = this._internalRoot;
        if (null === b) throw Error(p(409));
        fl(a, b, null, null);
      };
      ml.prototype.unmount = ll.prototype.unmount = function() {
        var a = this._internalRoot;
        if (null !== a) {
          this._internalRoot = null;
          var b = a.containerInfo;
          Rk(function() {
            fl(null, a, null, null);
          });
          b[uf] = null;
        }
      };
      function ml(a) {
        this._internalRoot = a;
      }
      ml.prototype.unstable_scheduleHydration = function(a) {
        if (a) {
          var b = Hc();
          a = { blockedOn: null, target: a, priority: b };
          for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
          Qc.splice(c, 0, a);
          0 === c && Vc(a);
        }
      };
      function nl(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
      }
      function ol(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
      }
      function pl() {
      }
      function ql(a, b, c, d, e3) {
        if (e3) {
          if ("function" === typeof d) {
            var f = d;
            d = function() {
              var a2 = gl(g);
              f.call(a2);
            };
          }
          var g = el2(b, d, a, 0, null, false, false, "", pl);
          a._reactRootContainer = g;
          a[uf] = g.current;
          sf(8 === a.nodeType ? a.parentNode : a);
          Rk();
          return g;
        }
        for (; e3 = a.lastChild; ) a.removeChild(e3);
        if ("function" === typeof d) {
          var h = d;
          d = function() {
            var a2 = gl(k);
            h.call(a2);
          };
        }
        var k = bl(a, 0, false, null, null, false, false, "", pl);
        a._reactRootContainer = k;
        a[uf] = k.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        Rk(function() {
          fl(b, k, c, d);
        });
        return k;
      }
      function rl(a, b, c, d, e3) {
        var f = c._reactRootContainer;
        if (f) {
          var g = f;
          if ("function" === typeof e3) {
            var h = e3;
            e3 = function() {
              var a2 = gl(g);
              h.call(a2);
            };
          }
          fl(b, g, a, e3);
        } else g = ql(c, b, a, e3, d);
        return gl(g);
      }
      Ec = function(a) {
        switch (a.tag) {
          case 3:
            var b = a.stateNode;
            if (b.current.memoizedState.isDehydrated) {
              var c = tc(b.pendingLanes);
              0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
            }
            break;
          case 13:
            Rk(function() {
              var b2 = ih(a, 1);
              if (null !== b2) {
                var c2 = R();
                gi(b2, a, 1, c2);
              }
            }), il(a, 1);
        }
      };
      Fc = function(a) {
        if (13 === a.tag) {
          var b = ih(a, 134217728);
          if (null !== b) {
            var c = R();
            gi(b, a, 134217728, c);
          }
          il(a, 134217728);
        }
      };
      Gc = function(a) {
        if (13 === a.tag) {
          var b = yi(a), c = ih(a, b);
          if (null !== c) {
            var d = R();
            gi(c, a, b, d);
          }
          il(a, b);
        }
      };
      Hc = function() {
        return C;
      };
      Ic = function(a, b) {
        var c = C;
        try {
          return C = a, b();
        } finally {
          C = c;
        }
      };
      yb = function(a, b, c) {
        switch (b) {
          case "input":
            bb(a, c);
            b = c.name;
            if ("radio" === c.type && null != b) {
              for (c = a; c.parentNode; ) c = c.parentNode;
              c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
              for (b = 0; b < c.length; b++) {
                var d = c[b];
                if (d !== a && d.form === a.form) {
                  var e3 = Db(d);
                  if (!e3) throw Error(p(90));
                  Wa(d);
                  bb(d, e3);
                }
              }
            }
            break;
          case "textarea":
            ib(a, c);
            break;
          case "select":
            b = c.value, null != b && fb(a, !!c.multiple, b, false);
        }
      };
      Gb = Qk;
      Hb = Rk;
      var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] };
      var tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
      var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
        a = Zb(a);
        return null === a ? null : a.stateNode;
      }, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
      if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
        vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!vl.isDisabled && vl.supportsFiber) try {
          kc = vl.inject(ul), lc = vl;
        } catch (a) {
        }
      }
      var vl;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
      exports.createPortal = function(a, b) {
        var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!nl(b)) throw Error(p(200));
        return cl(a, b, null, c);
      };
      exports.createRoot = function(a, b) {
        if (!nl(a)) throw Error(p(299));
        var c = false, d = "", e3 = kl;
        null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e3 = b.onRecoverableError));
        b = bl(a, 1, false, null, null, c, false, d, e3);
        a[uf] = b.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        return new ll(b);
      };
      exports.findDOMNode = function(a) {
        if (null == a) return null;
        if (1 === a.nodeType) return a;
        var b = a._reactInternals;
        if (void 0 === b) {
          if ("function" === typeof a.render) throw Error(p(188));
          a = Object.keys(a).join(",");
          throw Error(p(268, a));
        }
        a = Zb(b);
        a = null === a ? null : a.stateNode;
        return a;
      };
      exports.flushSync = function(a) {
        return Rk(a);
      };
      exports.hydrate = function(a, b, c) {
        if (!ol(b)) throw Error(p(200));
        return rl(null, a, b, true, c);
      };
      exports.hydrateRoot = function(a, b, c) {
        if (!nl(a)) throw Error(p(405));
        var d = null != c && c.hydratedSources || null, e3 = false, f = "", g = kl;
        null !== c && void 0 !== c && (true === c.unstable_strictMode && (e3 = true), void 0 !== c.identifierPrefix && (f = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
        b = el2(b, null, a, 1, null != c ? c : null, e3, false, f, g);
        a[uf] = b.current;
        sf(a);
        if (d) for (a = 0; a < d.length; a++) c = d[a], e3 = c._getVersion, e3 = e3(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e3] : b.mutableSourceEagerHydrationData.push(
          c,
          e3
        );
        return new ml(b);
      };
      exports.render = function(a, b, c) {
        if (!ol(b)) throw Error(p(200));
        return rl(null, a, b, false, c);
      };
      exports.unmountComponentAtNode = function(a) {
        if (!ol(a)) throw Error(p(40));
        return a._reactRootContainer ? (Rk(function() {
          rl(null, null, a, false, function() {
            a._reactRootContainer = null;
            a[uf] = null;
          });
        }), true) : false;
      };
      exports.unstable_batchedUpdates = Qk;
      exports.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
        if (!ol(c)) throw Error(p(200));
        if (null == a || void 0 === a._reactInternals) throw Error(p(38));
        return rl(a, b, c, false, d);
      };
      exports.version = "18.3.1-next-f1338f8080-20240426";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports) {
      "use strict";
      var m = require_react_dom();
      if (true) {
        exports.createRoot = m.createRoot;
        exports.hydrateRoot = m.hydrateRoot;
      } else {
        i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        exports.createRoot = function(c, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.createRoot(c, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
        exports.hydrateRoot = function(c, h, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.hydrateRoot(c, h, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
      }
      var i;
    }
  });

  // node_modules/react/cjs/react-jsx-runtime.production.min.js
  var require_react_jsx_runtime_production_min = __commonJS({
    "node_modules/react/cjs/react-jsx-runtime.production.min.js"(exports) {
      "use strict";
      var f = require_react();
      var k = Symbol.for("react.element");
      var l = Symbol.for("react.fragment");
      var m = Object.prototype.hasOwnProperty;
      var n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
      var p = { key: true, ref: true, __self: true, __source: true };
      function q(c, a, g) {
        var b, d = {}, e3 = null, h = null;
        void 0 !== g && (e3 = "" + g);
        void 0 !== a.key && (e3 = "" + a.key);
        void 0 !== a.ref && (h = a.ref);
        for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
        if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
        return { $$typeof: k, type: c, key: e3, ref: h, props: d, _owner: n.current };
      }
      exports.Fragment = l;
      exports.jsx = q;
      exports.jsxs = q;
    }
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_jsx_runtime_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // src/web/main.js
  var import_client = __toESM(require_client(), 1);

  // src/client/App.jsx
  var import_react6 = __toESM(require_react(), 1);

  // src/client/api.js
  var BACKEND_PORTS = [3400, 3401, 3402, 3403, 3404];
  var fetchGlobal = () => {
    const w = typeof window !== "undefined" ? window : globalThis;
    if (w.fetch === void 0) throw new Error("\u5F53\u524D\u73AF\u5883\u65E0 fetch\uFF0C\u65E0\u6CD5\u8FDE\u63A5\u672C\u5730\u540E\u7AEF");
    return w.fetch.bind(w);
  };
  var forcedApi = () => typeof window !== "undefined" && window.MEETING_BRAIN_API || null;
  async function probeBackend(port, timeoutMs = 2500) {
    const f = fetchGlobal();
    try {
      const res = await f(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) return false;
      const j = await res.json();
      return !!(j && j.ok && j.name === "meeting-brain");
    } catch {
      return false;
    }
  }
  var cachedApi = null;
  async function resolveApi() {
    const forced = forcedApi();
    if (forced) return forced;
    if (typeof window !== "undefined" && window.location && window.location.protocol.startsWith("http")) {
      try {
        const res = await fetchGlobal()("/api/health", { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const j = await res.json();
          if (j && j.ok && j.name === "meeting-brain") return "";
        }
      } catch {
      }
    }
    if (cachedApi !== null) {
      if (await probeBackend(cachedApi)) return cachedApi;
      cachedApi = null;
    }
    for (const p of BACKEND_PORTS) {
      if (await probeBackend(p)) {
        cachedApi = `http://127.0.0.1:${p}`;
        return cachedApi;
      }
    }
    return null;
  }
  function qs(params) {
    const u = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === void 0 || v === null || v === "") return;
      u.set(k, String(v));
    });
    const s = u.toString();
    return s ? "?" + s : "";
  }
  async function api(path, body, method, opts) {
    const base = await resolveApi();
    if (base === null) throw new Error("\u65E0\u6CD5\u8FDE\u63A5\u672C\u5730\u4F1A\u8BAE\u540E\u7AEF\uFF083400-3404 \u5747\u65E0\u54CD\u5E94\uFF09\uFF0C\u8BF7\u786E\u8BA4\u540E\u7AEF\u5DF2\u542F\u52A8");
    const url = base + path;
    const verb = method || (body === void 0 ? "GET" : "POST");
    const timeoutMs = opts && opts.timeoutMs || (verb === "GET" ? 2e4 : 18e4);
    const res = await fetchGlobal()(url, body === void 0 ? { method: verb, signal: AbortSignal.timeout(timeoutMs) } : { method: verb, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) {
      if (res.status === 404) {
        const missing = String(path || "");
        if (missing.indexOf("/api/app/update") === 0) {
          throw new Error("\u672C\u673A\u670D\u52A1\u8FD8\u662F\u65E7\u7248\u672C\uFF0C\u6CA1\u6709\u68C0\u67E5\u66F4\u65B0\u63A5\u53E3\u3002\u8BF7\u8FD0\u884C scripts/restart.sh\uFF08Windows \u8BF7\u53CC\u51FB scripts\\restart.bat\uFF09\u540E\u5237\u65B0\u6D4F\u89C8\u5668");
        }
        throw new Error("\u540E\u7AEF\u6CA1\u6709 " + missing + "\uFF0C\u8BF7\u91CD\u542F\u4F1A\u8BAE\u52A9\u624B");
      }
      const t = await res.text().catch(() => "");
      let msg = `\u540E\u7AEF\u9519\u8BEF ${res.status}`;
      try {
        const j = JSON.parse(t);
        if (j && j.error) msg = j.error;
      } catch {
        if (t) msg = t.slice(0, 200);
      }
      throw new Error(msg);
    }
    return res.json();
  }
  async function uploadAppZip(file) {
    const base = await resolveApi();
    if (base === null) throw new Error("\u65E0\u6CD5\u8FDE\u63A5\u672C\u5730\u4F1A\u8BAE\u540E\u7AEF\uFF083400-3404 \u5747\u65E0\u54CD\u5E94\uFF09\uFF0C\u8BF7\u786E\u8BA4\u540E\u7AEF\u5DF2\u542F\u52A8");
    const buf = await file.arrayBuffer();
    const res = await fetchGlobal()(base + "/api/app/update/zip", {
      method: "POST",
      headers: { "Content-Type": "application/zip" },
      body: buf,
      signal: AbortSignal.timeout(5 * 60 * 1e3)
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      let msg = `\u540E\u7AEF\u9519\u8BEF ${res.status}`;
      try {
        const j = JSON.parse(t);
        if (j && j.error) msg = j.error;
      } catch {
        if (t) msg = t.slice(0, 200);
      }
      throw new Error(msg);
    }
    return res.json();
  }
  function fallbackCopy(w, text) {
    try {
      const ta = w.document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      w.document.body.appendChild(ta);
      ta.select();
      w.document.execCommand("copy");
      w.document.body.removeChild(ta);
    } catch {
    }
  }

  // src/client/format.js
  var NAV = [["meet", "\u4F1A\u8BAE"], ["ledger", "\u5F85\u529E"], ["settings", "\u8BBE\u7F6E"]];
  var MEETING_TYPES = ["\u4E2A\u4EBA", "\u516C\u53F8\u7BA1\u7406", "\u516C\u53F8\u8FD0\u8425", "\u9879\u76EE", "\u90E8\u95E8"];
  var PUBLISH_TYPES = MEETING_TYPES.filter((t) => t !== "\u4E2A\u4EBA");
  var KB_DS = [
    { key: "mgmt", label: "\u516C\u53F8\u7BA1\u7406\u4F1A\u8BAE" },
    { key: "ops", label: "\u516C\u53F8\u8FD0\u8425\u4F1A\u8BAE" },
    { key: "project", label: "\u9879\u76EE\u4F1A\u8BAE" },
    { key: "dept", label: "\u90E8\u95E8\u4F1A\u8BAE" }
  ];
  var LLM_PRESETS = [
    { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com", model: "deepseek-chat" },
    { id: "ollama", label: "\u672C\u673A Ollama", baseUrl: "http://127.0.0.1:11434/v1", model: "qwen2.5:7b" },
    { id: "custom", label: "\u81EA\u5B9A\u4E49", baseUrl: "", model: "" }
  ];
  var MEET_PAGE = 60;
  var TODO_PAGE = 80;
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function ymd(ms = Date.now()) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function fmtShort(ms) {
    if (!ms) return "";
    const d = new Date(ms);
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function fmtDateTime(ms) {
    if (!ms) return "";
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function monthKey(ms) {
    const d = new Date(ms || 0);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  }
  function monthLabel(ms) {
    const d = new Date(ms || 0);
    return d.getFullYear() + "\u5E74" + (d.getMonth() + 1) + "\u6708";
  }
  function typeLabel(t) {
    if (!t) return "\u672A\u5B9A\u7C7B\u578B";
    return t;
  }
  function uploadBtnLabel(type) {
    if (!type || type === "\u4E2A\u4EBA") return "";
    return "\u4E0A\u4F20\u5230" + type;
  }
  function companyMark(m) {
    if (m.visibility !== "company") return "";
    const t = m.type || m.scope;
    return t && t !== "\u4E2A\u4EBA" ? "\u5DF2\u5230" + t : "\u5DF2\u4E0A\u4F20";
  }
  var PROVIDERS = [
    { id: "dingtalk", label: "\u9489\u9489" },
    { id: "feishu", label: "\u98DE\u4E66" },
    { id: "tencent", label: "\u817E\u8BAF" },
    { id: "import", label: "\u5BFC\u5165" }
  ];
  function providerLabel(p) {
    return { dingtalk: "\u9489\u9489", feishu: "\u98DE\u4E66", tencent: "\u817E\u8BAF", import: "\u5BFC\u5165" }[p] || "";
  }
  function srcLabel(s, provider) {
    if (s === "import" || provider === "import") return "\u5BFC\u5165";
    const p = providerLabel(provider);
    if (s === "shared") return p ? p + "\xB7\u5206\u4EAB" : "\u5206\u4EAB";
    return p || "\u542C\u8BB0";
  }
  function originLabel(o) {
    return { \u542C\u8BB0: "\u9489\u9489\u542C\u8BB0", \u9489\u9489\u542C\u8BB0: "\u9489\u9489\u542C\u8BB0", \u98DE\u4E66\u5999\u8BB0: "\u98DE\u4E66\u5999\u8BB0", \u817E\u8BAF\u7EAA\u8981: "\u817E\u8BAF\u7EAA\u8981", \u603B\u7ED3: "\u4F1A\u540E\u603B\u7ED3", \u624B\u5DE5: "\u624B\u5DE5" }[o] || o || "\u542C\u8BB0";
  }
  function lastSyncLabel(st) {
    if (!st || !st.last) return "";
    const t = st.last.at ? fmtShort(st.last.at) : "";
    const msg = String(st.last.message || "").trim();
    return [t, msg].filter(Boolean).join(" \xB7 ");
  }
  function syncProgressLabel(st) {
    const p = st && st.progress;
    if (!p) return "";
    if (p.phase === "list") return p.provider === "feishu" ? "\u6B63\u5728\u5217\u51FA\u98DE\u4E66\u5999\u8BB0\u2026" : p.provider === "tencent" ? "\u6B63\u5728\u5217\u51FA\u817E\u8BAF\u5F55\u5236\u2026" : "\u6B63\u5728\u5217\u51FA\u542C\u8BB0\u2026";
    if (p.phase === "index") return "\u6B63\u5728\u5EFA\u7ACB\u7D22\u5F15\u2026";
    if (p.phase === "pull" && p.total) {
      const n = (p.current || 0) + "/" + p.total;
      const title = String(p.title || "").trim();
      return title ? "\u5DF2\u62C9 " + n + " \xB7 " + title : "\u5DF2\u62C9 " + n;
    }
    return "\u540C\u6B65\u4E2D\u2026";
  }
  function lastSyncTitle(st) {
    if (!st || !st.last) return "";
    const t = st.last.at ? fmtDateTime(st.last.at) : "";
    const msg = String(st.last.message || "").trim();
    return [t, msg].filter(Boolean).join(" \xB7 ");
  }
  function groupMonths(list) {
    const months = [];
    const map = /* @__PURE__ */ new Map();
    list.forEach((x) => {
      const k = monthKey(x.time);
      if (!map.has(k)) {
        const g = { key: k, label: monthLabel(x.time), items: [] };
        map.set(k, g);
        months.push(g);
      }
      map.get(k).items.push(x);
    });
    return months;
  }

  // src/client/meet.jsx
  var import_react3 = __toESM(require_react(), 1);

  // src/client/ui.jsx
  var import_react = __toESM(require_react(), 1);
  var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
  var e = import_react.default.createElement;
  function CheckMark(props) {
    const on = !!props.on;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        className: "check" + (on ? " on" : ""),
        "aria-pressed": on,
        "aria-label": on ? "\u6062\u590D" : "\u5B8C\u6210",
        onClick: (ev) => {
          ev.stopPropagation();
          if (props.onClick) props.onClick(ev);
        }
      }
    );
  }
  function TitleInput(props) {
    const skipCommit = (0, import_react.useRef)(false);
    const inner = (0, import_react.useRef)(null);
    const setRef = (el2) => {
      inner.current = el2;
      if (typeof props.inputRef === "function") props.inputRef(el2);
      else if (props.inputRef) props.inputRef.current = el2;
    };
    const grow = () => {
      const el2 = inner.current;
      if (!el2) return;
      el2.style.height = "auto";
      el2.style.height = el2.scrollHeight + "px";
    };
    (0, import_react.useEffect)(() => {
      grow();
    }, [props.value]);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "textarea",
      {
        ref: setRef,
        rows: 1,
        className: "title-input" + (props.className ? " " + props.className : ""),
        value: props.value,
        placeholder: props.placeholder || "",
        autoFocus: !!props.autoFocus,
        onFocus: () => {
          if (props.onFocus) props.onFocus();
        },
        onChange: (ev) => {
          props.onChange(ev.target.value);
          requestAnimationFrame(grow);
        },
        onBlur: () => {
          if (skipCommit.current) {
            skipCommit.current = false;
            return;
          }
          if (props.onCommit) props.onCommit();
        },
        onKeyDown: (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            if (props.onEnter) props.onEnter();
            else ev.currentTarget.blur();
          }
          if (ev.key === "Escape") {
            ev.preventDefault();
            skipCommit.current = true;
            if (props.onCancel) props.onCancel();
            ev.currentTarget.blur();
          }
        }
      }
    );
  }
  function TodoRowTitle(props) {
    const [draft, setDraft] = (0, import_react.useState)(props.title);
    const focused = (0, import_react.useRef)(false);
    (0, import_react.useEffect)(() => {
      if (!focused.current) setDraft(props.title);
    }, [props.title]);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      TitleInput,
      {
        className: "title-input-row" + (props.className ? " " + props.className : ""),
        value: draft,
        onFocus: () => {
          focused.current = true;
          if (props.onFocus) props.onFocus();
        },
        onChange: setDraft,
        onCommit: () => {
          focused.current = false;
          const next = draft.trim();
          if (!next) {
            setDraft(props.title);
            if (props.toast) props.toast("\u5148\u5199\u5F85\u529E\u4E8B\u9879");
            return;
          }
          if (next !== props.title) props.onSave(next);
        },
        onCancel: () => {
          focused.current = false;
          setDraft(props.title);
        }
      }
    );
  }
  function useEscape(onClose) {
    (0, import_react.useEffect)(() => {
      if (!onClose) return void 0;
      const onKey = (ev) => {
        if (ev.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
  }
  function useDebounced(value, ms) {
    const [v, setV] = (0, import_react.useState)(value);
    (0, import_react.useEffect)(() => {
      const t = setTimeout(() => setV(value), ms);
      return () => clearTimeout(t);
    }, [value, ms]);
    return v;
  }
  function SheetFrame(props) {
    useEscape(props.onClose);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "veil", onClick: props.onClose, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sheet" + (props.narrow ? " narrow" : ""), onClick: (ev) => ev.stopPropagation(), children: [
      props.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: props.title }) : null,
      props.lede ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "lede", children: props.lede }) : null,
      props.children
    ] }) });
  }
  function ConfirmSheet(props) {
    const cancelRef = (0, import_react.useRef)(null);
    (0, import_react.useEffect)(() => {
      if (cancelRef.current) cancelRef.current.focus();
    }, []);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetFrame, { title: props.title, lede: props.lede, onClose: props.onClose, narrow: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sheet-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          className: props.danger ? "primary danger" : "primary",
          onClick: props.onConfirm,
          disabled: props.busy,
          children: props.busy ? props.busyLabel || "\u5904\u7406\u4E2D" : props.confirmLabel || "\u786E\u5B9A"
        }
      ),
      props.altLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "quiet", onClick: props.onAlt, disabled: props.busy, children: props.altLabel }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "quiet", ref: cancelRef, onClick: props.onClose, disabled: props.busy, children: "\u53D6\u6D88" })
    ] }) });
  }
  function InlineComposer(props) {
    const [val, setVal] = (0, import_react.useState)("");
    const ref = (0, import_react.useRef)(null);
    (0, import_react.useEffect)(() => {
      if (ref.current) ref.current.focus();
    }, []);
    const submit = () => {
      const t = val.trim();
      if (!t) return;
      props.onSubmit(t);
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "inline-add", style: props.style || null, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          ref,
          type: "text",
          className: props.compact ? "compact" : void 0,
          placeholder: props.placeholder || "",
          value: val,
          onChange: (ev) => setVal(ev.target.value),
          onKeyDown: (ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              submit();
            }
            if (ev.key === "Escape") {
              ev.preventDefault();
              props.onCancel();
            }
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "primary", type: "button", onClick: submit, children: props.submitLabel || "\u6DFB\u52A0" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "quiet", type: "button", onClick: props.onCancel, children: "\u53D6\u6D88" })
    ] });
  }
  function renderInline(text, key, linkMap, onMeetingClick) {
    const out = [];
    const parts = String(text).split(/\*\*(.+?)\*\*/g);
    parts.forEach((p, i) => {
      if (i % 2 === 1) {
        out.push(e("strong", { className: "md-b", key: key + "-b" + i }, p));
        return;
      }
      if (!p) return;
      const segs = p.split(/(\[[^\]]+\])/g);
      segs.forEach((seg, j) => {
        if (!seg) return;
        const m = seg.match(/^\[(.+)\]$/);
        if (m && linkMap && linkMap[m[1]] !== void 0) {
          out.push(e("span", { key: key + "-l" + i + "-" + j, className: "linkish", onClick: () => onMeetingClick && onMeetingClick(linkMap[m[1]]) }, m[1]));
        } else {
          out.push(seg);
        }
      });
    });
    return out;
  }
  function Md(props) {
    const text = props.text;
    const linkMap = props.linkMap;
    const onMeetingClick = props.onMeetingClick;
    if (!text) return e("div", null);
    const lines = String(text).split("\n");
    const blocks = [];
    let i = 0;
    const ri = (txt, k) => renderInline(txt, k, linkMap, onMeetingClick);
    while (i < lines.length) {
      const line = lines[i];
      const t = line.trim();
      if (t.startsWith("#")) {
        const m = t.match(/^(#{1,3})\s+(.*)/);
        if (m) {
          const cls = m[1].length === 1 ? "md-h1" : m[1].length === 2 ? "md-h2" : "md-h3";
          blocks.push(e("div", { className: cls, key: "b" + blocks.length }, ri(m[2], "b" + blocks.length)));
          i++;
          continue;
        }
      }
      if (t.startsWith(">")) {
        blocks.push(e("div", { className: "md-quote", key: "q" + blocks.length }, ri(t.replace(/^>\s?/, ""), "q" + blocks.length)));
        i++;
        continue;
      }
      if (t.startsWith("|")) {
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          rows.push(lines[i].trim());
          i++;
        }
        const splitRow = (r) => {
          const parts = r.split("|");
          if (parts[0] === "") parts.shift();
          if (parts[parts.length - 1] === "") parts.pop();
          return parts.map((c) => c.trim());
        };
        const isSep = (r) => splitRow(r).every((c) => /^:?-{2,}:?$/.test(c));
        const parsed = rows.filter((r) => !isSep(r)).map(splitRow);
        if (parsed.length > 0) {
          const keyBase = "tbl" + blocks.length;
          const head = parsed[0];
          const body = parsed.slice(1);
          blocks.push(e(
            "table",
            { className: "mbdg-table", key: keyBase },
            e("thead", null, e("tr", null, head.map((c, ci) => e("th", { key: ci }, ri(c, keyBase + "-h" + ci))))),
            e("tbody", null, body.map((row, riRow) => e("tr", { key: riRow }, row.map((c, ci) => e("td", { key: ci }, ri(c, keyBase + "-" + riRow + "-" + ci))))))
          ));
        }
        continue;
      }
      if (/^[-*]\s/.test(t) || /^\d+\.\s/.test(t)) {
        blocks.push(e("div", { className: "md-li", key: "l" + blocks.length }, ri(t.replace(/^[-*]\s/, "\u2022 ").replace(/^\d+\.\s/, ""), "l" + blocks.length)));
        i++;
        continue;
      }
      if (/^```/.test(t)) {
        i++;
        const code = [];
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          code.push(lines[i]);
          i++;
        }
        i++;
        blocks.push(e("pre", { className: "md-code", key: "c" + blocks.length, style: { whiteSpace: "pre-wrap", padding: 8 } }, code.join("\n")));
        continue;
      }
      if (t === "") {
        i++;
        continue;
      }
      if (/^!\[.*\]\(.*\)$/.test(t)) {
        i++;
        continue;
      }
      blocks.push(e("div", { className: "md-p", key: "p" + blocks.length }, ri(line, "p" + blocks.length)));
      i++;
    }
    return e("div", null, blocks);
  }

  // src/client/meeting-detail.jsx
  var import_react2 = __toESM(require_react(), 1);
  var e2 = import_react2.default.createElement;
  function foldProject(s) {
    return String(s || "").trim().toLowerCase();
  }
  function unionProjects(local, remote) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const push = (p) => {
      const name = String(p && p.name || "").trim();
      if (!name) return;
      const code = String(p && p.code || "").trim();
      const keys = [foldProject(code), foldProject(name)].filter(Boolean);
      if (keys.some((k) => seen.has(k))) return;
      keys.forEach((k) => seen.add(k));
      out.push({ name, code });
    };
    (remote || []).forEach(push);
    (local || []).forEach(push);
    return out;
  }
  function writebackToast(r) {
    const msgs = [];
    if (r && r.dingTalkTitle && r.dingTalkTitle.message) msgs.push(r.dingTalkTitle.message);
    if (r && r.dingTalkSummary && r.dingTalkSummary.message) msgs.push(r.dingTalkSummary.message);
    return msgs.join("\uFF1B");
  }
  function MeetingDetail(props) {
    const uuid = props.uuid;
    const active = props.active !== false;
    const meetTag = props.meetTag;
    const onTag = props.onTag;
    const onChanged = props.onChanged;
    const onDeleted = props.onDeleted;
    const onJumpTodo = props.onJumpTodo;
    const toast = props.toast;
    const [d, setD] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [sub, setSub] = import_react2.default.useState("record");
    const [deep, setDeep] = import_react2.default.useState("");
    const [deeping, setDeeping] = import_react2.default.useState(false);
    const [copied, setCopied] = import_react2.default.useState(false);
    const [editing, setEditing] = import_react2.default.useState(false);
    const [editingBody, setEditingBody] = import_react2.default.useState(null);
    const [title, setTitle] = import_react2.default.useState("");
    const [attendees, setAttendees] = import_react2.default.useState("");
    const [summary, setSummary] = import_react2.default.useState("");
    const [txDraft, setTxDraft] = import_react2.default.useState("");
    const [scope, setScope] = import_react2.default.useState("");
    const [projectName, setProjectName] = import_react2.default.useState("");
    const [addingProject, setAddingProject] = import_react2.default.useState(false);
    const [editProjectQuery, setEditProjectQuery] = import_react2.default.useState("");
    const [tags, setTags] = import_react2.default.useState([]);
    const [saving, setSaving] = import_react2.default.useState(false);
    const [savingBody, setSavingBody] = import_react2.default.useState(false);
    const [addingTag, setAddingTag] = import_react2.default.useState(false);
    const [addingTodo, setAddingTodo] = import_react2.default.useState(false);
    const [todoTitle, setTodoTitle] = import_react2.default.useState("");
    const [todoOwner, setTodoOwner] = import_react2.default.useState("");
    const [todoBusy, setTodoBusy] = import_react2.default.useState(false);
    const [confirmDel, setConfirmDel] = import_react2.default.useState(false);
    const [delBusy, setDelBusy] = import_react2.default.useState(false);
    const [confirmRefresh, setConfirmRefresh] = import_react2.default.useState(false);
    const [refreshBusy, setRefreshBusy] = import_react2.default.useState(false);
    const [classifyBusy, setClassifyBusy] = import_react2.default.useState(false);
    const [confirmDeep, setConfirmDeep] = import_react2.default.useState(false);
    const [confirmSharedTitle, setConfirmSharedTitle] = import_react2.default.useState(false);
    const [confirmRetract, setConfirmRetract] = import_react2.default.useState(false);
    const [confirmOverwrite, setConfirmOverwrite] = import_react2.default.useState(false);
    const [confirmUploadGate, setConfirmUploadGate] = import_react2.default.useState(false);
    const [pickType, setPickType] = import_react2.default.useState("");
    const [pickName, setPickName] = import_react2.default.useState("");
    const [pickQuery, setPickQuery] = import_react2.default.useState("");
    const [addingPick, setAddingPick] = import_react2.default.useState(false);
    const [pickBusy, setPickBusy] = import_react2.default.useState(false);
    const [remoteProjects, setRemoteProjects] = import_react2.default.useState([]);
    const [pubRemote, setPubRemote] = import_react2.default.useState(null);
    const [pubOperator, setPubOperator] = import_react2.default.useState("");
    const [pubBusy, setPubBusy] = import_react2.default.useState(false);
    const titleOnlyRef = import_react2.default.useRef(false);
    const load = import_react2.default.useCallback(() => {
      setD(null);
      setErr(null);
      setSub("record");
      setDeep("");
      setEditing(false);
      setEditingBody(null);
      setAddingTag(false);
      setAddingTodo(false);
      setAddingProject(false);
      setEditProjectQuery("");
      setConfirmDel(false);
      setConfirmDeep(false);
      setConfirmSharedTitle(false);
      setConfirmRetract(false);
      setConfirmOverwrite(false);
      setConfirmUploadGate(false);
      setConfirmRefresh(false);
      setPubRemote(null);
      api("/api/detail?id=" + encodeURIComponent(uuid)).then((r) => {
        if (r && r.error) setErr(r.error);
        else {
          setD(r);
          setTitle(r.title || "");
          setAttendees(r.attendees || "");
          setSummary(r.summary || "");
          setTxDraft((r.transcript || []).join("\n"));
          setDeep(r.deepSummary || "");
          setScope(r.type || r.scope || "");
          setProjectName(r.projectName || "");
          setTags(r.tags || []);
        }
      }).catch((e3) => setErr(String(e3 && e3.message || e3)));
    }, [uuid]);
    import_react2.default.useEffect(() => {
      load();
    }, [load]);
    const refreshProjects = import_react2.default.useCallback(() => {
      api("/api/projects").then((r) => {
        const items = r && r.items || [];
        setD((prev) => prev ? { ...prev, projects: items } : prev);
      }).catch(() => {
      });
    }, []);
    const wasActive = import_react2.default.useRef(!!active);
    import_react2.default.useEffect(() => {
      const now = !!active;
      const became = now && !wasActive.current;
      wasActive.current = now;
      if (became) refreshProjects();
    }, [active, refreshProjects]);
    import_react2.default.useEffect(() => {
      if (editing || confirmUploadGate) refreshProjects();
    }, [editing, confirmUploadGate, refreshProjects]);
    const editQDebounced = useDebounced(editProjectQuery, 280);
    const pickQDebounced = useDebounced(pickQuery, 280);
    import_react2.default.useEffect(() => {
      const raw = confirmUploadGate ? pickQDebounced : editQDebounced;
      const q = String(raw || "").trim();
      if (!editing && !confirmUploadGate || [...q].length < 2) {
        setRemoteProjects([]);
        return void 0;
      }
      let stop = false;
      api("/api/ht/projects?q=" + encodeURIComponent(q)).then((r) => {
        if (stop) return;
        if (!r || r.configured === false) {
          setRemoteProjects([]);
          return;
        }
        setRemoteProjects(r.items || []);
      }).catch(() => {
        if (!stop) setRemoteProjects([]);
      });
      return () => {
        stop = true;
      };
    }, [editing, confirmUploadGate, editQDebounced, pickQDebounced]);
    const rememberProject = import_react2.default.useCallback((p) => {
      const name = String(p && p.name || "").trim();
      if (!name) return;
      const row = { name, code: String(p && p.code || "").trim() };
      setD((prev) => prev ? { ...prev, projects: unionProjects(prev.projects, [row]) } : prev);
      api("/api/settings/projects-sync", { items: [row] }).catch(() => {
      });
    }, []);
    const doDeep = () => {
      if (deeping) return;
      if (String(deep || "").trim()) {
        setConfirmDeep(true);
        return;
      }
      runDeep();
    };
    const runDeep = () => {
      if (deeping) return;
      setConfirmDeep(false);
      setDeeping(true);
      setCopied(false);
      api("/api/summarize", { id: uuid }).then((r) => {
        if (r && r.error) {
          toast("\u751F\u6210\u5931\u8D25: " + r.error);
          return;
        }
        const text = r && r.summary || "";
        setDeep(text);
        setEditingBody(null);
        setD((prev) => prev ? { ...prev, deepSummary: text } : prev);
        toast("\u603B\u7ED3\u5DF2\u4FDD\u5B58\u5230\u672C\u673A");
      }).catch((err2) => toast("\u751F\u6210\u5931\u8D25: " + String(err2 && err2.message || err2))).finally(() => setDeeping(false));
    };
    const copyText = (text) => {
      const w = typeof window !== "undefined" ? window : globalThis;
      const plain = String(text || "");
      if (!plain) return;
      const done = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      };
      if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
        w.navigator.clipboard.writeText(plain).then(done).catch(() => {
          fallbackCopy(w, plain);
          done();
        });
      } else {
        fallbackCopy(w, plain);
        done();
      }
    };
    const saveDeep = () => {
      if (savingBody) return;
      setSavingBody(true);
      api("/api/meeting", { id: uuid, deepSummary: deep }, "PATCH").then((r) => {
        setD(r);
        setDeep(r && r.deepSummary != null ? r.deepSummary : deep);
        setEditingBody(null);
        toast("\u5DF2\u4FDD\u5B58\u5230\u672C\u673A");
        if (onChanged) onChanged();
      }).catch((err2) => toast(String(err2 && err2.message || err2))).finally(() => setSavingBody(false));
    };
    const cancelBody = () => {
      setSummary(d && d.summary || "");
      setTxDraft((d && d.transcript || []).join("\n"));
      setDeep(d && d.deepSummary || "");
      setEditingBody(null);
    };
    const startBodyEdit = () => {
      setEditing(false);
      setTitle(d && d.title || "");
      setAttendees(d && d.attendees || "");
      setScope(d && (d.type || d.scope) || "");
      setTags(d && d.tags || []);
      setSummary(d && d.summary || "");
      setTxDraft((d && d.transcript || []).join("\n"));
      setDeep(d && d.deepSummary || "");
      setEditingBody(sub);
    };
    const saveBody = () => {
      if (savingBody || deeping) return;
      if (editingBody === "deep") {
        saveDeep();
        return;
      }
      setSavingBody(true);
      const body = { id: uuid };
      if (editingBody === "record") body.summary = summary;
      if (editingBody === "transcript") body.transcript = txDraft;
      api("/api/meeting", body, "PATCH").then((r) => {
        setD(r);
        setSummary(r && r.summary || "");
        setTxDraft((r && r.transcript || []).join("\n"));
        setEditingBody(null);
        const msg = writebackToast(r);
        toast(editingBody === "record" && msg ? msg : "\u5DF2\u4FDD\u5B58\u5230\u672C\u673A");
        if (onChanged) onChanged();
      }).catch((err2) => toast(String(err2 && err2.message || err2))).finally(() => setSavingBody(false));
    };
    const goSub = (id) => {
      if (editingBody) cancelBody();
      setCopied(false);
      setSub(id);
    };
    const commitTitle = (opts) => {
      if (saving) return;
      const next = String(title || "").trim();
      const prev = String(d && d.title || "");
      if (!next) {
        setTitle(prev);
        toast("\u5148\u5199\u6807\u9898");
        return;
      }
      if (next === prev) return;
      const shared = d && d.source === "shared" && (!d.provider || d.provider === "dingtalk");
      const writebackOn = d && d.writebackEnabled !== false;
      if (shared && writebackOn && !(opts && opts.sharedTitleDecided)) {
        titleOnlyRef.current = true;
        setConfirmSharedTitle(true);
        return;
      }
      setConfirmSharedTitle(false);
      setSaving(true);
      const body = { id: uuid, title: next };
      if (opts && opts.skipDingTalk) body.skipDingTalk = true;
      api("/api/meeting", body, "PATCH").then((r) => {
        setD(r);
        setTitle(r && r.title || next);
        if (r && r.dingTalkTitle && r.dingTalkTitle.message) toast(r.dingTalkTitle.message);
        if (onChanged) onChanged();
      }).catch((err2) => toast(String(err2 && err2.message || err2))).finally(() => setSaving(false));
    };
    const saveEdit = (opts) => {
      if (saving) return;
      const titleChanged = String(title).trim() !== String(d && d.title || "");
      const shared = d && d.source === "shared" && (!d.provider || d.provider === "dingtalk");
      const writebackOn = d && d.writebackEnabled !== false;
      if (titleChanged && shared && writebackOn && !(opts && opts.sharedTitleDecided)) {
        titleOnlyRef.current = false;
        setConfirmSharedTitle(true);
        return;
      }
      setConfirmSharedTitle(false);
      setSaving(true);
      const body = { id: uuid, title: String(title || "").trim() || d.title, attendees, type: scope, tags, projectName };
      if (opts && opts.skipDingTalk) body.skipDingTalk = true;
      api("/api/meeting", body, "PATCH").then((r) => {
        setD(r);
        setEditing(false);
        if (r && r.title) setTitle(r.title);
        if (r && r.dingTalkTitle && r.dingTalkTitle.message) toast(r.dingTalkTitle.message);
        else if (scope === "\u4E2A\u4EBA" && d && d.visibility === "company") toast("\u5DF2\u4FDD\u5B58\uFF0C\u4E2A\u4EBA\u4F1A\u8BAE\u5DF2\u53D6\u6D88\u4E0A\u4F20");
        else toast("\u5DF2\u4FDD\u5B58");
        if (onChanged) onChanged();
      }).catch((err2) => setErr(String(err2 && err2.message || err2))).finally(() => setSaving(false));
    };
    const doPublish = (visibility, extra) => {
      if (!d || pubBusy) return;
      const t = d.type || d.scope;
      setPubBusy(true);
      api("/api/publish", { id: uuid, visibility, ...extra || {} }).then((r) => {
        if (r && r.needsOverwrite) {
          setPubRemote(r.existing || null);
          setPubOperator(r.operator || "");
          setConfirmOverwrite(true);
          return;
        }
        setConfirmRetract(false);
        setConfirmOverwrite(false);
        toast(r.message || (visibility === "company" ? uploadBtnLabel(t) || "\u5DF2\u4E0A\u4F20" : "\u5DF2\u53D6\u6D88\u4E0A\u4F20"));
        load();
        if (onChanged) onChanged();
      }).catch((err2) => toast(String(err2 && err2.message || err2))).finally(() => setPubBusy(false));
    };
    const togglePublish = () => {
      if (!d || pubBusy) return;
      const t = d.type || d.scope;
      if (t === "\u4E2A\u4EBA") {
        toast("\u4E2A\u4EBA\u4F1A\u8BAE\u4E0D\u4E0A\u4F20");
        return;
      }
      if (d.visibility === "company") {
        setPubBusy(true);
        api("/api/publish/status?id=" + encodeURIComponent(uuid)).then((st) => {
          setPubRemote(st.remote || null);
          setPubOperator(st.operator || "");
          setConfirmRetract(true);
        }).catch((err2) => toast(String(err2 && err2.message || err2))).finally(() => setPubBusy(false));
        return;
      }
      if (!t || t === "\u9879\u76EE" && !String(d.projectName || "").trim()) {
        setPickType(t === "\u9879\u76EE" ? "\u9879\u76EE" : "");
        setPickName("");
        setPickQuery("");
        setAddingPick(false);
        setConfirmUploadGate(true);
        return;
      }
      doPublish("company");
    };
    const closeUploadGate = () => {
      if (pickBusy) return;
      setConfirmUploadGate(false);
      setPickType("");
      setPickName("");
      setPickQuery("");
      setAddingPick(false);
    };
    const submitUploadGate = () => {
      const type = String(pickType || "").trim();
      const name = String(pickName || "").trim();
      if (!type || pickBusy || pubBusy) return;
      if (type === "\u9879\u76EE" && !name) return;
      setPickBusy(true);
      const body = { id: uuid, type };
      if (type === "\u9879\u76EE") body.projectName = name;
      api("/api/meeting", body, "PATCH").then((r) => {
        setD(r);
        setScope(r && (r.type || r.scope) || type);
        setProjectName(r && r.projectName || name);
        setConfirmUploadGate(false);
        setPickType("");
        setPickName("");
        setPickQuery("");
        setAddingPick(false);
        if (onChanged) onChanged();
        doPublish("company");
      }).catch((err2) => toast(String(err2 && err2.message || err2))).finally(() => setPickBusy(false));
    };
    const addTag = (name) => {
      const t = String(name || "").trim();
      if (!t || tags.includes(t)) {
        setAddingTag(false);
        return;
      }
      setTags(tags.concat([t]));
      setAddingTag(false);
    };
    const removeLocal = () => setConfirmDel(true);
    const canRefresh = d && d.canRefresh !== false && d.provider !== "import" && d.source !== "import" && !String(uuid || "").startsWith("import-");
    const fromLabel = d && d.providerLabel || "\u6765\u6E90";
    const doRefresh = () => {
      if (refreshBusy) return;
      setRefreshBusy(true);
      cancelBody();
      setEditing(false);
      api("/api/meeting/refresh", { id: uuid }, "POST", { timeoutMs: 5 * 60 * 1e3 }).then((r) => {
        setConfirmRefresh(false);
        setD(r);
        setTitle(r && r.title || "");
        setAttendees(r && r.attendees || "");
        setSummary(r && r.summary || "");
        setTxDraft((r && r.transcript || []).join("\n"));
        setDeep(r && r.deepSummary || "");
        setScope(r && (r.type || r.scope) || "");
        setProjectName(r && r.projectName || "");
        setTags(r && r.tags || []);
        toast(r && r.refresh && r.refresh.message || "\u5DF2\u4ECE" + fromLabel + "\u91CD\u62C9");
        if (onChanged) onChanged();
      }).catch((err2) => {
        const msg = String(err2 && err2.message || err2);
        if (/timeout|timed out|TimeoutError/i.test(msg)) {
          toast("\u8FD8\u5728\u4ECE" + fromLabel + "\u62C9\uFF0C\u8BF7\u7B49\u51E0\u5206\u949F\u518D\u70B9\u8FD9\u573A\u4F1A\u3002\u5148\u4E0D\u8981\u53CD\u590D\u5237\u65B0\u7F51\u9875\u3002");
        } else {
          toast(msg);
        }
      }).finally(() => setRefreshBusy(false));
    };
    const doClassify = () => {
      if (classifyBusy) return;
      setClassifyBusy(true);
      api("/api/classify", { id: uuid }).then((r) => {
        const m = r && r.meeting;
        if (m) {
          setD(m);
          setScope(m.type || m.scope || "");
          setProjectName(m.projectName || "");
          setTags(m.tags || []);
        }
        const hit = r && r.items && r.items[0];
        toast(hit ? "\u5DF2\u6807\u4E3A" + hit.type + (hit.project ? " \xB7 " + hit.project : "") + (hit.tags && hit.tags.length ? " \xB7 " + hit.tags.join("\u3001") : "") : "\u6CA1\u6709\u89C4\u5219\u547D\u4E2D");
        if (onChanged) onChanged();
      }).catch((err2) => toast(String(err2 && err2.message || err2))).finally(() => setClassifyBusy(false));
    };
    const doRemove = () => {
      if (delBusy) return;
      setDelBusy(true);
      api("/api/meeting/delete", { id: uuid }).then(() => {
        toast("\u5DF2\u4ECE\u672C\u673A\u79FB\u9664");
        if (onDeleted) onDeleted(uuid);
      }).catch((err2) => {
        toast(String(err2 && err2.message || err2));
        setDelBusy(false);
        setConfirmDel(false);
      });
    };
    const submitMeetTodo = () => {
      const title2 = todoTitle.trim();
      if (!title2 || todoBusy) return;
      setTodoBusy(true);
      api("/api/todos", { title: title2, meetingId: uuid, owner: todoOwner.trim(), origin: "\u624B\u5DE5" }).then(() => {
        toast("\u5DF2\u6DFB\u52A0");
        setAddingTodo(false);
        setTodoTitle("");
        setTodoOwner("");
        api("/api/detail?id=" + encodeURIComponent(uuid)).then((r) => {
          if (r && !r.error) setD(r);
        });
        if (onChanged) onChanged();
      }).catch((err2) => toast(String(err2 && err2.message || err2))).finally(() => setTodoBusy(false));
    };
    const toggleMeetTodo = (t) => {
      if (!t.id) return;
      const next = t.status === "done" ? "open" : "done";
      setD((prev) => prev ? {
        ...prev,
        actions: (prev.actions || []).map((a) => a.id === t.id ? { ...a, status: next } : a)
      } : prev);
      api("/api/todos", { id: t.id, status: next }, "PATCH").catch((err2) => {
        setD((prev) => prev ? {
          ...prev,
          actions: (prev.actions || []).map((a) => a.id === t.id ? { ...a, status: t.status } : a)
        } : prev);
        toast(String(err2 && err2.message || err2));
      });
    };
    const saveMeetTodoTitle = (t, next) => {
      if (!t.id) return;
      const prevTitle = t.title;
      setD((p) => p ? {
        ...p,
        actions: (p.actions || []).map((a) => a.id === t.id ? { ...a, title: next } : a)
      } : p);
      api("/api/todos", { id: t.id, title: next }, "PATCH").catch((err2) => {
        setD((p) => p ? {
          ...p,
          actions: (p.actions || []).map((a) => a.id === t.id ? { ...a, title: prevTitle } : a)
        } : p);
        toast(String(err2 && err2.message || err2));
      });
    };
    if (err) return e2("p", { className: "empty" }, "\u52A0\u8F7D\u5931\u8D25: " + err);
    if (!d) return e2("p", { className: "empty" }, "\u52A0\u8F7D\u4E2D\u2026");
    const tx = d.transcript || [];
    const txText = tx.join("\n");
    const synced = d.visibility === "company";
    const meetType = d.type || d.scope || "";
    const personal = meetType === "\u4E2A\u4EBA";
    const tools = editing ? [
      e2("button", { className: "primary", key: "s", onClick: saveEdit, disabled: saving }, saving ? "\u4FDD\u5B58\u4E2D" : "\u4FDD\u5B58"),
      e2("button", { className: "quiet", key: "c", onClick: () => {
        setTitle(d && d.title || "");
        setAttendees(d && d.attendees || "");
        setScope(d && (d.type || d.scope) || "");
        setProjectName(d && d.projectName || "");
        setEditProjectQuery("");
        setTags(d && d.tags || []);
        setEditing(false);
      } }, "\u53D6\u6D88")
    ] : [
      e2("button", { className: "quiet", key: "e", onClick: () => {
        cancelBody();
        setEditProjectQuery("");
        setEditing(true);
      } }, "\u7F16\u8F91"),
      canRefresh ? e2("button", { className: "quiet", key: "rf", disabled: refreshBusy, onClick: () => setConfirmRefresh(true) }, refreshBusy ? "\u91CD\u62C9\u4E2D" : "\u91CD\u62C9") : null,
      e2("button", { className: "quiet danger", key: "del", onClick: removeLocal }, "\u5220\u9664"),
      personal ? e2("span", { className: "meta", key: "p", style: { margin: "0 0 0 8px" } }, "\u4E2A\u4EBA\u4E0D\u4E0A\u4F20") : e2("button", {
        className: "sync-pill" + (synced ? " on" : ""),
        key: "pub",
        disabled: pubBusy || pickBusy,
        onClick: togglePublish
      }, pubBusy ? confirmRetract || confirmOverwrite ? synced ? "\u64A4\u56DE\u4E2D\u2026" : "\u4E0A\u4F20\u4E2D\u2026" : synced ? "\u67E5\u8BE2\u4E2D\u2026" : "\u4E0A\u4F20\u4E2D\u2026" : synced ? companyMark(d) || "\u5DF2\u4E0A\u4F20" : uploadBtnLabel(meetType) || "\u4E0A\u4F20")
    ];
    const pickScope = (s) => {
      setScope(s);
      if (s !== "\u9879\u76EE") {
        setProjectName("");
        setAddingProject(false);
        setEditProjectQuery("");
      }
    };
    const projectHits = (() => {
      const q = String(editProjectQuery || "").trim().toLowerCase();
      const rows = unionProjects(d.projects || [], remoteProjects);
      if (projectName && !rows.some((p) => p.name === projectName)) {
        rows.unshift({ name: projectName, code: "" });
      }
      if (!q) {
        return { q, list: rows.filter((p) => p.name === projectName), more: 0 };
      }
      const matched = rows.filter((p) => String(p.name || "").toLowerCase().includes(q) || String(p.code || "").toLowerCase().includes(q));
      const cap = 12;
      return { q, list: matched.slice(0, cap), more: Math.max(0, matched.length - cap) };
    })();
    const tagRow = editing ? e2(
      "div",
      null,
      e2(
        "div",
        { className: "tags", style: { marginTop: 10 } },
        tags.map((t) => e2("button", { type: "button", className: "tag on", key: t, onClick: () => setTags(tags.filter((x) => x !== t)) }, t, e2("span", { className: "x" }, "\xD7"))),
        addingTag ? e2(InlineComposer, {
          key: "tag-in",
          compact: true,
          placeholder: "\u6807\u7B7E",
          submitLabel: "\u6DFB\u52A0",
          onSubmit: addTag,
          onCancel: () => setAddingTag(false)
        }) : e2("button", { type: "button", className: "quiet", key: "add", onClick: () => setAddingTag(true) }, "+ \u6807\u7B7E")
      ),
      e2(
        "div",
        { className: "field", style: { marginTop: 10 } },
        e2("span", null, "\u7C7B\u578B"),
        e2(
          "div",
          { className: "cat-pills" },
          e2("button", {
            type: "button",
            key: "none",
            className: !scope ? "on" : "",
            onClick: () => pickScope("")
          }, "\u672A\u5B9A"),
          MEETING_TYPES.map((s) => e2("button", {
            type: "button",
            key: s,
            className: scope === s ? "on" : "",
            onClick: () => pickScope(s)
          }, s))
        )
      ),
      scope === "\u9879\u76EE" ? e2(
        "div",
        { className: "field", style: { marginTop: 10 }, key: "proj" },
        e2("span", null, "\u9879\u76EE"),
        e2("input", {
          type: "text",
          placeholder: "\u8F93\u5165\u540D\u79F0\u6216\u7F16\u53F7\u7B5B\u9009",
          value: editProjectQuery,
          onChange: (ev) => setEditProjectQuery(ev.target.value)
        }),
        e2(
          "div",
          { className: "cat-pills" },
          e2("button", {
            type: "button",
            key: "proj-none",
            className: !projectName ? "on" : "",
            onClick: () => {
              setProjectName("");
              setAddingProject(false);
            }
          }, "\u672A\u6807"),
          projectHits.list.map((p) => e2("button", {
            type: "button",
            key: "proj-" + p.name,
            className: projectName === p.name ? "on" : "",
            onClick: () => {
              setProjectName(p.name);
              setAddingProject(false);
              setEditProjectQuery("");
              rememberProject(p);
            }
          }, p.name + (p.code ? " \xB7 " + p.code : ""))),
          addingProject ? e2(InlineComposer, {
            key: "proj-in",
            compact: true,
            placeholder: "\u9879\u76EE\u540D",
            submitLabel: "\u786E\u5B9A",
            onSubmit: (name) => {
              const n = String(name || "").trim();
              if (n) setProjectName(n);
              setAddingProject(false);
              setEditProjectQuery("");
            },
            onCancel: () => setAddingProject(false)
          }) : e2("button", { type: "button", className: "quiet", key: "proj-add", onClick: () => setAddingProject(true) }, "+ \u5176\u4ED6")
        ),
        !projectHits.q && !projectName ? e2("p", { className: "hint", style: { marginTop: 6 } }, "\u9879\u76EE\u5F88\u591A\uFF0C\u5148\u641C\u540D\u79F0\u6216\u7F16\u53F7\u3002") : projectHits.q && !projectHits.list.length ? e2("p", { className: "hint", style: { marginTop: 6 } }, "\u6CA1\u6709\u5339\u914D\u7684\u9879\u76EE\u3002") : projectHits.more ? e2("p", { className: "hint", style: { marginTop: 6 } }, "\u8FD8\u6709 " + projectHits.more + " \u4E2A\uFF0C\u518D\u5199\u7EC6\u4E00\u70B9\u3002") : null
      ) : null
    ) : e2(
      "div",
      { className: "tags" },
      e2("span", { className: "tag", style: { cursor: "default" } }, typeLabel(meetType)),
      meetType === "\u9879\u76EE" && d.projectName ? e2("button", {
        type: "button",
        className: "tag" + (meetTag === d.projectName ? " active" : ""),
        key: "proj",
        onClick: () => onTag && onTag(d.projectName)
      }, d.projectName + (d.projectCode ? " \xB7 " + d.projectCode : "")) : meetType === "\u9879\u76EE" ? e2("span", { className: "tag", key: "proj-miss", style: { cursor: "default" } }, "\u672A\u6807\u660E\u9879\u76EE") : null,
      d.scopeSource !== "user" ? e2("button", {
        type: "button",
        className: "quiet",
        key: "cls",
        disabled: classifyBusy,
        onClick: doClassify
      }, classifyBusy ? "\u586B\u5199\u4E2D" : meetType ? "\u6309\u89C4\u5219\u91CD\u7B97" : "\u6309\u89C4\u5219\u586B\u5199") : null,
      (d.tags || []).filter((t) => t !== d.projectName).map((t) => e2("button", {
        type: "button",
        className: "tag" + (meetTag === t ? " active" : ""),
        key: t,
        onClick: () => onTag && onTag(t)
      }, t))
    );
    const tabActions = (() => {
      if (editingBody) {
        return [
          e2("button", { className: "primary", key: "s", onClick: saveBody, disabled: savingBody || deeping }, savingBody ? "\u4FDD\u5B58\u4E2D" : "\u4FDD\u5B58"),
          e2("button", { className: "quiet", key: "c", onClick: cancelBody, disabled: savingBody }, "\u53D6\u6D88")
        ];
      }
      const items = [e2("button", { className: "sync-pill", key: "e", onClick: startBodyEdit, disabled: deeping }, "\u7F16\u8F91")];
      if (sub === "deep" && deep) {
        items.unshift(e2("button", {
          className: "sync-pill",
          key: "gen",
          onClick: doDeep,
          disabled: deeping
        }, deeping ? "\u751F\u6210\u4E2D" : "\u91CD\u65B0\u751F\u6210"));
      }
      const copySrc = sub === "record" ? d && d.summary : sub === "transcript" ? txText : deep;
      if (String(copySrc || "").trim()) {
        items.push(e2("button", { className: "quiet", key: "cp", onClick: () => copyText(copySrc), disabled: deeping }, copied ? "\u5DF2\u590D\u5236" : "\u590D\u5236"));
      }
      return items;
    })();
    const bodyHint = editingBody === "transcript" ? "\u884C\u9996\u3010\u59D3\u540D\u3011\u5C3D\u91CF\u4FDD\u7559\uFF0C\u751F\u6210\u603B\u7ED3\u8FD8\u9760\u5B83\u3002" : editingBody === "record" ? d.writebackEnabled === false ? "\u53EA\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u5199\u56DE\u5DF2\u5173\u95ED\u3002" : d.writebackCapable === false ? "\u53EA\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u8FD9\u4E2A\u6765\u6E90\u4E0D\u652F\u6301\u5199\u56DE\u3002" : "\u4FDD\u5B58\u540E\u4F1A\u5199\u56DE" + fromLabel + "\u7EAA\u8981\u3002\u6CA1\u6709\u7F16\u8F91\u6743\u6216\u5BFC\u5165\u573A\u6B21\u53EA\u6539\u672C\u673A\u3002" : editingBody === "deep" ? "\u53EA\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u4E0D\u5199\u56DE\u6765\u6E90\u3002" : sub === "record" && d.summaryEdited ? "\u672C\u673A\u6539\u8FC7\uFF0C\u542C\u8BB0\u518D\u62C9\u4E5F\u4E0D\u4F1A\u76D6\u6389\u3002" : sub === "transcript" && d.transcriptEdited ? "\u672C\u673A\u6539\u8FC7\uFF0C\u542C\u8BB0\u518D\u62C9\u4E5F\u4E0D\u4F1A\u76D6\u6389\u3002" : "";
    return e2(
      "div",
      null,
      e2(
        "div",
        { className: "doc-head" },
        e2(
          "div",
          { style: { minWidth: 0, flex: 1 } },
          e2(TitleInput, {
            value: title,
            placeholder: "\u4F1A\u8BAE\u6807\u9898",
            onChange: setTitle,
            onCommit: commitTitle,
            onCancel: () => setTitle(d && d.title || "")
          }),
          editing ? e2("input", { type: "text", style: { marginTop: 8 }, value: attendees, onChange: (ev) => setAttendees(ev.target.value), placeholder: "\u53C2\u4F1A\u4EBA" }) : e2(
            "p",
            { className: "meta-line" },
            [fmtDateTime(d.startTime), d.attendees, srcLabel(d.source, d.provider), synced ? companyMark(d) : "", personal ? "\u4E2A\u4EBA\u4E0D\u4E0A\u4F20" : ""].filter(Boolean).join(" \xB7 ")
          ),
          tagRow
        ),
        e2("div", { className: "tools" }, tools)
      ),
      e2(
        "div",
        { className: "tabs" },
        e2("button", { className: "tab" + (sub === "record" ? " on" : ""), onClick: () => goSub("record") }, "\u8BB0\u5F55"),
        e2("button", { className: "tab" + (sub === "transcript" ? " on" : ""), onClick: () => goSub("transcript") }, "\u9010\u5B57\u7A3F"),
        e2("button", { className: "tab" + (sub === "deep" ? " on" : ""), onClick: () => goSub("deep") }, "\u603B\u7ED3"),
        e2("div", { className: "tabs-actions" }, tabActions)
      ),
      sub === "record" ? e2(
        "div",
        { className: "body-pane" },
        editingBody === "record" ? e2("textarea", { className: "body-edit", value: summary, onChange: (ev) => setSummary(ev.target.value) }) : d.summary ? e2(Md, { text: d.summary }) : e2("p", { className: "hint" }, "\u8FD8\u6CA1\u6709\u8BB0\u5F55\u3002"),
        bodyHint ? e2("p", { className: "hint body-hint" }, bodyHint) : null
      ) : null,
      sub === "transcript" ? e2(
        "div",
        { className: "body-pane" },
        editingBody === "transcript" ? e2("textarea", { className: "body-edit tx-edit", value: txDraft, onChange: (ev) => setTxDraft(ev.target.value) }) : e2("div", { className: "tx" }, txText || "\u6CA1\u6709\u9010\u5B57\u7A3F"),
        bodyHint ? e2("p", { className: "hint body-hint" }, bodyHint) : null
      ) : null,
      sub === "deep" ? e2(
        "div",
        { className: "body-pane" },
        deeping ? e2("p", { className: "hint" }, "\u751F\u6210\u4E2D\u2026") : editingBody === "deep" ? e2("textarea", { className: "body-edit", value: deep, onChange: (ev) => setDeep(ev.target.value) }) : deep ? e2(Md, { text: deep }) : e2(
          "div",
          { className: "deep-empty" },
          e2("p", { className: "hint" }, "\u8FD8\u6CA1\u6709\u603B\u7ED3\u3002\u6839\u636E\u9010\u5B57\u7A3F\u751F\u6210\u672C\u673A\u51B3\u7B56\u8BB0\u5F55\u3002"),
          e2("button", { className: "primary", onClick: doDeep, disabled: deeping }, "\u751F\u6210\u603B\u7ED3")
        ),
        bodyHint ? e2("p", { className: "hint body-hint" }, bodyHint) : null
      ) : null,
      e2(
        "div",
        { className: "todo-strip" },
        e2("h3", null, "\u5F85\u529E"),
        (d.actions || []).length ? d.actions.map((t) => e2(
          "div",
          { className: "todo-mini" + (t.status === "done" ? " closed" : ""), key: t.id || t.title },
          t.id ? e2(CheckMark, {
            on: t.status === "done",
            onClick: (ev) => {
              ev.stopPropagation();
              toggleMeetTodo(t);
            }
          }) : e2("span", { className: "check", style: { visibility: "hidden" } }),
          t.id ? e2(TodoRowTitle, { title: t.title, toast, onSave: (next) => saveMeetTodoTitle(t, next) }) : e2("span", { className: "todo-mini-title" }, t.title),
          t.id ? e2("button", { className: "linkish", onClick: () => onJumpTodo && onJumpTodo(t.id) }, "\u5F85\u529E") : null
        )) : e2("p", { className: "hint" }, "\u672C\u573A\u6CA1\u6709\u5F85\u529E"),
        addingTodo ? e2(
          "div",
          { className: "inline-add", key: "todo-in" },
          e2("input", {
            type: "text",
            placeholder: "\u5F85\u529E\u4E8B\u9879",
            value: todoTitle,
            onChange: (ev) => setTodoTitle(ev.target.value),
            onKeyDown: (ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                submitMeetTodo();
              }
              if (ev.key === "Escape") {
                ev.preventDefault();
                setAddingTodo(false);
              }
            },
            autoFocus: true
          }),
          e2("input", {
            type: "text",
            className: "compact",
            placeholder: "\u8D23\u4EFB\u4EBA\uFF0C\u53EF\u7A7A",
            value: todoOwner,
            onChange: (ev) => setTodoOwner(ev.target.value),
            onKeyDown: (ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                submitMeetTodo();
              }
              if (ev.key === "Escape") {
                ev.preventDefault();
                setAddingTodo(false);
              }
            }
          }),
          e2("button", { className: "primary", type: "button", disabled: todoBusy, onClick: submitMeetTodo }, todoBusy ? "\u6DFB\u52A0\u4E2D" : "\u6DFB\u52A0"),
          e2("button", { className: "quiet", type: "button", onClick: () => setAddingTodo(false) }, "\u53D6\u6D88")
        ) : e2("button", { className: "quiet", onClick: () => {
          setAddingTodo(true);
          setTodoTitle("");
          setTodoOwner("");
        } }, "+ \u5F85\u529E")
      ),
      confirmDel ? e2(ConfirmSheet, {
        title: "\u4ECE\u672C\u673A\u79FB\u9664",
        lede: "\u53EA\u5220\u672C\u673A\u5217\u8868\u91CC\u7684\u8FD9\u573A\u4F1A\u3002\u5BF9\u65B9\u542C\u8BB0\u8FD8\u5728\u3002\u672C\u573A\u8BB0\u5F55\u3001\u9010\u5B57\u7A3F\u3001\u603B\u7ED3\u548C\u5F85\u529E\u90FD\u4F1A\u4ECE\u672C\u673A\u53BB\u6389\uFF0C\u4EE5\u540E\u66F4\u65B0\u4E5F\u4E0D\u4F1A\u518D\u62C9\u56DE\u6765\u3002",
        confirmLabel: "\u5220\u9664",
        danger: true,
        busy: delBusy,
        onConfirm: doRemove,
        onClose: () => {
          if (!delBusy) setConfirmDel(false);
        }
      }) : null,
      confirmRefresh ? e2(ConfirmSheet, {
        title: "\u4ECE" + fromLabel + "\u91CD\u62C9",
        lede: refreshBusy ? "\u6B63\u5728\u4ECE" + fromLabel + "\u62C9\u6807\u9898\u3001\u8BB0\u5F55\u548C\u9010\u5B57\u7A3F\u3002\u957F\u4F1A\u53EF\u80FD\u8981\u51E0\u5206\u949F\u3002\u8BF7\u7B49\u63D0\u793A\u5DF2\u91CD\u62C9\uFF0C\u5148\u4E0D\u8981\u5237\u65B0\u7F51\u9875\u3002" : "\u7528" + fromLabel + "\u6700\u65B0\u7684\u6807\u9898\u3001\u8BB0\u5F55\u3001\u9010\u5B57\u7A3F\u548C\u5F85\u529E\u8986\u76D6\u672C\u673A\u3002\u672C\u673A\u624B\u6539\u8FC7\u7684\u8BB0\u5F55\u3001\u9010\u5B57\u7A3F\u4E0D\u8986\u76D6\u3002\u672C\u673A\u603B\u7ED3\u3001\u7C7B\u578B\u3001\u9879\u76EE\u3001\u6807\u7B7E\u548C\u662F\u5426\u4E0A\u4F20\u90FD\u4E0D\u53D8\u3002\u957F\u4F1A\u53EF\u80FD\u8981\u51E0\u5206\u949F\uFF0C\u62C9\u5B8C\u524D\u8BF7\u4E0D\u8981\u5237\u65B0\u7F51\u9875\u3002",
        confirmLabel: "\u91CD\u62C9",
        busyLabel: "\u91CD\u62C9\u4E2D\u2026",
        busy: refreshBusy,
        onConfirm: doRefresh,
        onClose: () => {
          if (!refreshBusy) setConfirmRefresh(false);
        }
      }) : null,
      confirmDeep ? e2(ConfirmSheet, {
        title: "\u91CD\u65B0\u751F\u6210\u603B\u7ED3",
        lede: "\u4F1A\u8986\u76D6\u672C\u673A\u5DF2\u4FDD\u5B58\u7684\u603B\u7ED3\uFF0C\u5305\u62EC\u4F60\u6539\u8FC7\u7684\u5185\u5BB9\u3002\u6765\u6E90\u4FA7\u542C\u8BB0\u4E0D\u4F1A\u6539\u3002",
        confirmLabel: "\u91CD\u65B0\u751F\u6210",
        onConfirm: runDeep,
        onClose: () => setConfirmDeep(false)
      }) : null,
      confirmRetract ? e2(ConfirmSheet, {
        title: "\u64A4\u56DE\u516C\u53F8\u77E5\u8BC6\u5E93",
        lede: (() => {
          const who = pubRemote && pubRemote.uploadedBy;
          const other = who && pubOperator && who !== pubOperator;
          if (other) return "\u8FD9\u7BC7\u662F" + who + "\u4E0A\u4F20\u7684\u3002\u64A4\u56DE\u4F1A\u4ECE\u300C" + (meetType || "\u5BF9\u5E94") + "\u300D\u77E5\u8BC6\u5E93\u5220\u6389\u73B0\u5728\u8FD9\u4E00\u4EFD\u3002\u672C\u673A\u8BB0\u5F55\u3001\u603B\u7ED3\u548C\u5F85\u529E\u90FD\u8FD8\u5728\u3002";
          return "\u4F1A\u4ECE\u300C" + (meetType || "\u5BF9\u5E94") + "\u300D\u77E5\u8BC6\u5E93\u5220\u6389\u8FD9\u573A\u4F1A\u90A3\u4E00\u7BC7\u3002\u672C\u673A\u8BB0\u5F55\u3001\u603B\u7ED3\u548C\u5F85\u529E\u90FD\u8FD8\u5728\u3002";
        })(),
        confirmLabel: "\u64A4\u56DE",
        danger: true,
        busy: pubBusy,
        onConfirm: () => doPublish("private"),
        onClose: () => {
          if (!pubBusy) setConfirmRetract(false);
        }
      }) : null,
      confirmUploadGate ? e2(
        SheetFrame,
        {
          title: pickType === "\u9879\u76EE" && (d.type || d.scope) === "\u9879\u76EE" ? "\u6807\u660E\u9879\u76EE\u540E\u4E0A\u4F20" : "\u9009\u7C7B\u578B\u540E\u4E0A\u4F20",
          lede: d.type || d.scope ? "\u9879\u76EE\u4F1A\u8BAE\u8FDB\u540C\u4E00\u4E2A\u77E5\u8BC6\u5E93\u3002\u5148\u9009\u8FD9\u573A\u4F1A\u662F\u54EA\u4E2A\u9879\u76EE\uFF0C\u518D\u4E0A\u4F20\u3002" : "\u5148\u9009\u8FD9\u573A\u4F1A\u7684\u7C7B\u578B\uFF0C\u518D\u4E0A\u4F20\u5230\u5BF9\u5E94\u77E5\u8BC6\u5E93\u3002\u4E2A\u4EBA\u4F1A\u8BAE\u4E0D\u80FD\u4E0A\u4F20\u3002",
          onClose: closeUploadGate
        },
        d.type || d.scope ? null : e2(
          "div",
          { className: "field" },
          e2("span", null, "\u7C7B\u578B"),
          e2(
            "div",
            { className: "cat-pills" },
            PUBLISH_TYPES.map((s) => e2("button", {
              type: "button",
              key: "ut-" + s,
              className: pickType === s ? "on" : "",
              disabled: pickBusy,
              onClick: () => {
                setPickType(s);
                if (s !== "\u9879\u76EE") {
                  setPickName("");
                  setAddingPick(false);
                }
              }
            }, s))
          )
        ),
        pickType === "\u9879\u76EE" ? e2(
          "div",
          { className: "field", key: "up" },
          e2("span", null, "\u9879\u76EE"),
          e2("input", {
            type: "text",
            placeholder: "\u8FC7\u6EE4\u540D\u79F0\u6216\u7F16\u53F7",
            value: pickQuery,
            onChange: (ev) => setPickQuery(ev.target.value)
          }),
          e2(
            "div",
            { className: "cat-pills" },
            (() => {
              const q = String(pickQuery || "").trim().toLowerCase();
              const rows = unionProjects(d.projects || [], remoteProjects).filter((p) => {
                if (!q) return true;
                return String(p.name || "").toLowerCase().includes(q) || String(p.code || "").toLowerCase().includes(q);
              });
              if (pickName && !rows.some((p) => p.name === pickName) && !q) {
                rows.unshift({ name: pickName, code: "" });
              }
              const pills = rows.map((p) => e2("button", {
                type: "button",
                key: "pick-" + p.name,
                className: pickName === p.name ? "on" : "",
                disabled: pickBusy,
                onClick: () => {
                  setPickName(p.name);
                  setAddingPick(false);
                  rememberProject(p);
                }
              }, p.name + (p.code ? " \xB7 " + p.code : "")));
              pills.push(addingPick ? e2(InlineComposer, {
                key: "pick-in",
                compact: true,
                placeholder: "\u9879\u76EE\u540D",
                submitLabel: "\u786E\u5B9A",
                onSubmit: (name) => {
                  const n = String(name || "").trim();
                  if (n) setPickName(n);
                  setAddingPick(false);
                },
                onCancel: () => setAddingPick(false)
              }) : e2("button", {
                type: "button",
                className: "quiet",
                key: "pick-add",
                disabled: pickBusy,
                onClick: () => setAddingPick(true)
              }, "+ \u5176\u4ED6"));
              return pills;
            })()
          )
        ) : null,
        e2(
          "div",
          { className: "sheet-actions" },
          e2("button", {
            className: "primary",
            disabled: pickBusy || !pickType || pickType === "\u9879\u76EE" && !String(pickName || "").trim(),
            onClick: submitUploadGate
          }, pickBusy ? "\u4E0A\u4F20\u4E2D\u2026" : uploadBtnLabel(pickType) || "\u4E0A\u4F20"),
          e2("button", { className: "quiet", disabled: pickBusy, onClick: closeUploadGate }, "\u53D6\u6D88")
        )
      ) : null,
      confirmOverwrite ? e2(ConfirmSheet, {
        title: "\u8986\u76D6\u5DF2\u6709\u6587\u6863",
        lede: (() => {
          const who = pubRemote && pubRemote.uploadedBy;
          const when = pubRemote && pubRemote.uploadedAt ? fmtDateTime(Date.parse(pubRemote.uploadedAt)) : "";
          const whoWhen = [who, when].filter(Boolean).join(" \xB7 ");
          if (whoWhen) return "\u77E5\u8BC6\u5E93\u91CC\u5DF2\u6709\u8FD9\u7BC7\uFF08" + whoWhen + "\uFF09\u3002\u8986\u76D6\u4F1A\u6362\u6210\u4F60\u8FD9\u4EFD\u603B\u7ED3\u548C\u5F85\u529E\u3002";
          return "\u77E5\u8BC6\u5E93\u91CC\u5DF2\u6709\u8FD9\u7BC7\u3002\u8986\u76D6\u4F1A\u6362\u6210\u4F60\u8FD9\u4EFD\u603B\u7ED3\u548C\u5F85\u529E\u3002";
        })(),
        confirmLabel: "\u8986\u76D6",
        danger: true,
        busy: pubBusy,
        onConfirm: () => doPublish("company", { overwrite: true }),
        onClose: () => {
          if (!pubBusy) setConfirmOverwrite(false);
        }
      }) : null,
      confirmSharedTitle ? e2(ConfirmSheet, {
        title: "\u6539\u5206\u4EAB\u573A\u6B21\u7684\u6807\u9898",
        lede: "\u8FD9\u573A\u4F1A\u662F\u522B\u4EBA\u5206\u4EAB\u7684\u3002\u540C\u6B65\u5230\u9489\u9489\u4F1A\u6539\u542C\u8BB0\u4E0A\u7684\u6807\u9898\uFF08\u4F60\u82E5\u6709\u7F16\u8F91\u6743\uFF09\u3002\u4E5F\u53EF\u4EE5\u53EA\u6539\u672C\u673A\u5217\u8868\u3002",
        confirmLabel: "\u540C\u6B65\u5230\u9489\u9489",
        altLabel: "\u53EA\u6539\u672C\u673A",
        busy: saving,
        onConfirm: () => titleOnlyRef.current ? commitTitle({ sharedTitleDecided: true }) : saveEdit({ sharedTitleDecided: true }),
        onAlt: () => titleOnlyRef.current ? commitTitle({ sharedTitleDecided: true, skipDingTalk: true }) : saveEdit({ sharedTitleDecided: true, skipDingTalk: true }),
        onClose: () => {
          if (saving) return;
          setTitle(d && d.title || "");
          setConfirmSharedTitle(false);
        }
      }) : null
    );
  }
  function ImportSheet(props) {
    const [title, setTitle] = import_react2.default.useState("");
    const [date, setDate] = import_react2.default.useState(() => ymd());
    const [body, setBody] = import_react2.default.useState("");
    const [busy, setBusy] = import_react2.default.useState(false);
    const submit = (ev) => {
      ev.stopPropagation();
      if (busy) return;
      if (!body.trim()) {
        props.toast("\u5148\u8D34\u6B63\u6587");
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        props.toast("\u9009\u4E2A\u4F1A\u8BAE\u65E5\u671F");
        return;
      }
      setBusy(true);
      api("/api/import", { title, body, date }).then((r) => {
        props.toast("\u5DF2\u5BFC\u5165");
        props.onImported(r.id);
      }).catch((err) => props.toast(String(err && err.message || err))).finally(() => setBusy(false));
    };
    return e2(
      SheetFrame,
      { title: "\u5BFC\u5165", lede: "\u628A\u4E0D\u662F\u4ECE\u542C\u8BB0\u540C\u6B65\u6765\u7684\u7EAA\u8981\u8D34\u8FDB\u6765\uFF0C\u6210\u4E3A\u4E00\u573A\u672C\u673A\u4F1A\u8BAE\u3002\u9489\u9489\u3001\u98DE\u4E66\u3001\u817E\u8BAF\u8BF7\u5230\u5217\u8868\u70B9\u300C\u66F4\u65B0\u300D\u3002", onClose: props.onClose },
      e2("textarea", { className: "paste", placeholder: "\u7C98\u8D34\u7EAA\u8981\u6216\u8F6C\u5199", value: body, onChange: (ev) => setBody(ev.target.value) }),
      e2(
        "div",
        { className: "field-row" },
        e2("div", { className: "field" }, e2("span", null, "\u6807\u9898"), e2("input", { type: "text", placeholder: "\u8FD9\u573A\u4F1A\u53EB\u4EC0\u4E48", value: title, onChange: (ev) => setTitle(ev.target.value) })),
        e2("div", { className: "field" }, e2("span", null, "\u4F1A\u8BAE\u65E5\u671F"), e2("input", { type: "date", value: date, onChange: (ev) => setDate(ev.target.value) }))
      ),
      e2(
        "div",
        { className: "sheet-actions" },
        e2("button", { className: "primary", onClick: submit, disabled: busy }, busy ? "\u5BFC\u5165\u4E2D" : "\u5BFC\u5165"),
        e2("button", { className: "quiet", onClick: (ev) => {
          ev.stopPropagation();
          props.onClose();
        } }, "\u53D6\u6D88")
      )
    );
  }

  // src/client/meet.jsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
  function MeetPage(props) {
    const { selected, setSelected, toast, goLedger, active } = props;
    const [items, setItems] = (0, import_react3.useState)(null);
    const [total, setTotal] = (0, import_react3.useState)(0);
    const [nextCursor, setNextCursor] = (0, import_react3.useState)(null);
    const [err, setErr] = (0, import_react3.useState)(null);
    const [st, setSt] = (0, import_react3.useState)(null);
    const [syncing, setSyncing] = (0, import_react3.useState)(false);
    const [moreBusy, setMoreBusy] = (0, import_react3.useState)(false);
    const [meetFilter, setMeetFilter] = (0, import_react3.useState)("all");
    const [meetType, setMeetType] = (0, import_react3.useState)("");
    const [meetProvider, setMeetProvider] = (0, import_react3.useState)("");
    const [meetTag, setMeetTag] = (0, import_react3.useState)("");
    const [meetQuery, setMeetQuery] = (0, import_react3.useState)("");
    const [askQ, setAskQ] = (0, import_react3.useState)("");
    const [askA, setAskA] = (0, import_react3.useState)("");
    const [askHits, setAskHits] = (0, import_react3.useState)([]);
    const [asking, setAsking] = (0, import_react3.useState)(false);
    const [showImport, setShowImport] = (0, import_react3.useState)(false);
    const [tick, setTick] = (0, import_react3.useState)(0);
    const qDebounced = useDebounced(meetQuery, 280);
    const reqId = (0, import_react3.useRef)(0);
    const seenSyncAt = (0, import_react3.useRef)(null);
    const expectSync = (0, import_react3.useRef)(false);
    const syncMark = (0, import_react3.useRef)(0);
    const kickPoll = (0, import_react3.useRef)(null);
    const fetchPage = (0, import_react3.useCallback)((opts = {}) => {
      const id = ++reqId.current;
      const append = !!opts.append;
      const cursor = opts.cursor || "";
      if (append) setMoreBusy(true);
      return api("/api/meetings" + qs({
        q: qDebounced,
        tag: meetTag,
        type: meetType,
        provider: meetProvider,
        filter: meetFilter === "company" ? "company" : "",
        cursor,
        limit: MEET_PAGE
      })).then((r) => {
        if (id !== reqId.current) return;
        const next = r.items || [];
        setErr(null);
        setTotal(r.total || 0);
        setNextCursor(r.nextCursor || null);
        setItems((prev) => append ? (prev || []).concat(next) : next);
      }).catch((er) => {
        if (id !== reqId.current) return;
        if (!append) setErr(String(er && er.message || er));
        else toast(String(er && er.message || er));
      }).finally(() => {
        if (append) setMoreBusy(false);
      });
    }, [qDebounced, meetTag, meetType, meetFilter, meetProvider]);
    (0, import_react3.useEffect)(() => {
      fetchPage();
    }, [fetchPage, tick]);
    (0, import_react3.useEffect)(() => {
      let stop = false;
      let timer = 0;
      const apply = (r, fromPoll) => {
        if (stop || !r) return;
        setSt((prev) => {
          if (!fromPoll || !prev) return r.sources ? r : { ...r, dws: prev && prev.dws || r.dws, sources: prev && prev.sources || r.sources };
          return { ...prev, ...r, dws: prev.dws || r.dws, sources: prev.sources || r.sources };
        });
        if (r.syncing) setSyncing(true);
        else if (fromPoll && expectSync.current) {
          const lastAt = r.last && r.last.at || 0;
          if (lastAt >= syncMark.current) {
            expectSync.current = false;
            setSyncing(false);
          }
        } else if (fromPoll) {
          setSyncing(false);
        }
        const at = r.last && r.last.at;
        if (!at) return;
        const prevAt = seenSyncAt.current;
        seenSyncAt.current = at;
        if (!fromPoll || prevAt == null || prevAt === at) return;
        if (r.last.success && r.last.added > 0) {
          toast("\u542C\u8BB0\u5DF2\u66F4\u65B0 \xB7 " + (r.last.message || "\u65B0\u589E " + r.last.added + " \u6761"));
          setTick((n) => n + 1);
        } else if (r.last.success === false) {
          toast(r.last.message || "\u81EA\u52A8\u66F4\u65B0\u5931\u8D25");
        }
      };
      const poll = (ms) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          api("/api/sync-status?meta=1").then((r) => {
            apply(r, true);
            poll(r && (r.syncing || expectSync.current) ? 2e3 : 2e4);
          }).catch(() => {
            poll(2e4);
          });
        }, ms);
      };
      api("/api/sync-status").then((r) => {
        apply(r, false);
        if (r && r.dws && !r.dws.authenticated) {
          setTimeout(() => {
            api("/api/sync-status").then((x) => apply(x, false)).catch(() => {
            });
          }, 2500);
        }
        poll(r && r.syncing ? 2e3 : 2e4);
      }).catch(() => {
        poll(2e4);
      });
      kickPoll.current = () => {
        clearTimeout(timer);
        api("/api/sync-status?meta=1").then((r) => {
          apply(r, true);
          poll(r && (r.syncing || expectSync.current) ? 2e3 : 2e4);
        }).catch(() => {
          poll(2e3);
        });
      };
      const onVis = () => {
        if (document.visibilityState !== "visible") return;
        api("/api/sync-status?meta=1").then((r) => apply(r, true)).catch(() => {
        });
      };
      document.addEventListener("visibilitychange", onVis);
      return () => {
        stop = true;
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVis);
      };
    }, [toast]);
    const doSync = () => {
      if (syncing) return;
      setSyncing(true);
      expectSync.current = true;
      syncMark.current = Date.now();
      api("/api/sync", {}).then((r) => {
        toast(r.message || "\u5F00\u59CB\u66F4\u65B0");
        setSt((prev) => ({ ...prev || {}, syncing: true }));
        if (kickPoll.current) kickPoll.current();
      }).catch((er) => {
        expectSync.current = false;
        toast(String(er && er.message || er));
        setSyncing(false);
      });
    };
    const doAsk = () => {
      if (!askQ.trim() || asking) return;
      setAsking(true);
      api("/api/ask", { query: askQ.trim() }).then((r) => {
        if (r && r.error) {
          setAskA("\u9519\u8BEF: " + r.error);
          setAskHits([]);
        } else {
          setAskA(r && r.answer || "");
          setAskHits(r && r.hits || []);
        }
      }).catch((er) => {
        setAskA("\u9519\u8BEF: " + String(er && er.message || er));
        setAskHits([]);
      }).finally(() => setAsking(false));
    };
    const closeAsk = () => {
      setAskA("");
      setAskHits([]);
    };
    const pulling = syncing || !!(st && st.syncing);
    if (err) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "pane", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty", children: err }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "quiet", onClick: () => {
          setErr(null);
          fetchPage();
        }, children: "\u91CD\u8BD5" })
      ] });
    }
    if (!items) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "pane", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty", children: "\u52A0\u8F7D\u4E2D\u2026" }) });
    const currentId = selected || items[0] && items[0].taskUuid;
    const months = groupMonths(items);
    const sources = st && st.sources || {};
    const logged = ["dingtalk", "feishu", "tencent"].filter((id) => sources[id] && sources[id].authenticated);
    const loggedLabel = logged.map((id) => {
      const s = sources[id];
      return (s.label || id) + (s.user ? "\xB7" + s.user : "");
    }).join(" / ");
    const linkMap = askHits.reduce((m, h) => {
      if (h.title) m[h.title] = h.taskUuid;
      return m;
    }, {});
    const remain = Math.max(0, total - items.length);
    const doLogin = () => {
      const first = ["dingtalk", "feishu", "tencent"].find((id) => sources[id] && !sources[id].authenticated) || "dingtalk";
      api("/api/sources/login", { provider: first }).then((r) => {
        toast(r && r.message || "\u8BF7\u6309\u63D0\u793A\u5B8C\u6210\u767B\u5F55");
      }).catch((er) => toast(String(er && er.message || er)));
    };
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "split-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "pane", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { children: "\u4F1A\u8BAE" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "intake", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "intake-st", title: lastSyncTitle(st) || void 0, children: pulling ? syncProgressLabel(st) || "\u66F4\u65B0\u4E2D" : logged.length ? loggedLabel + (lastSyncLabel(st) ? " \xB7 " + lastSyncLabel(st) : " \xB7 \u8FD8\u6CA1\u66F4\u65B0\u8FC7") : "\u542C\u8BB0\u6765\u6E90\u672A\u767B\u5F55" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tools", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "quiet", onClick: doSync, disabled: pulling, children: pulling ? "\u66F4\u65B0\u4E2D" : "\u66F4\u65B0" }),
            logged.length ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "quiet", onClick: doLogin, children: "\u767B\u5F55" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "quiet", onClick: () => setShowImport(true), children: "\u5BFC\u5165" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "askbox", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              id: "ask-q",
              type: "text",
              placeholder: "\u95EE\u8FD9\u573A\u4F1A\u5B9A\u4E86\u4EC0\u4E48",
              value: askQ,
              onChange: (ev) => setAskQ(ev.target.value),
              onKeyDown: (ev) => {
                if (ev.key === "Enter") doAsk();
                if (ev.key === "Escape") closeAsk();
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "quiet", onClick: doAsk, disabled: asking, children: asking ? "\u95EE\u2026" : "\u95EE" }),
          askA ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "quiet", onClick: closeAsk, children: "\u5173\u95ED" }) : null
        ] }),
        askA ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "ans", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Md, { text: askA, linkMap, onMeetingClick: (id) => id && setSelected(id) }) }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "filters", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "meet-filter" + (meetFilter === "all" && !meetTag && !meetType && !meetProvider ? " on" : ""),
              onClick: () => {
                setMeetFilter("all");
                setMeetTag("");
                setMeetType("");
                setMeetProvider("");
              },
              children: "\u5168\u90E8"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "meet-filter" + (meetFilter === "company" ? " on" : ""),
              onClick: () => setMeetFilter(meetFilter === "company" ? "all" : "company"),
              children: "\u5DF2\u5230\u516C\u53F8"
            }
          ),
          PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "meet-filter" + (meetProvider === p.id ? " on" : ""),
              onClick: () => setMeetProvider(meetProvider === p.id ? "" : p.id),
              children: p.label
            },
            p.id
          )),
          MEETING_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "meet-filter" + (meetType === t ? " on" : ""),
              onClick: () => setMeetType(meetType === t ? "" : t),
              children: t
            },
            t
          ))
        ] }),
        meetTag ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tags", style: { margin: "0 0 10px" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "tag active", onClick: () => setMeetTag(""), children: [
          meetTag,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "x", children: "\xD7" })
        ] }) }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            type: "text",
            placeholder: "\u8FC7\u6EE4\u6807\u9898\u3001\u9879\u76EE\u6216\u6807\u7B7E",
            value: meetQuery,
            onChange: (ev) => setMeetQuery(ev.target.value),
            style: { marginBottom: 8 }
          }
        ),
        months.length ? months.map((g) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "month", children: g.label }),
          g.items.map((x) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "div",
            {
              className: "m-item" + (x.taskUuid === currentId ? " sel" : ""),
              onClick: () => setSelected(x.taskUuid),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "t", children: x.title }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "meta", children: [fmtShort(x.time), srcLabel(x.source, x.provider), x.projectName || (x.tags || [])[0], companyMark(x)].filter(Boolean).join(" \xB7 ") })
              ]
            },
            x.taskUuid
          ))
        ] }, g.key)) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty", children: "\u6CA1\u6709\u4F1A\u8BAE" }),
        nextCursor ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "more-row", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "quiet", disabled: moreBusy, onClick: () => fetchPage({ append: true, cursor: nextCursor }), children: moreBusy ? "\u52A0\u8F7D\u4E2D" : "\u540E\u9762\u8FD8\u6709 " + remain + " \u573A" }) }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "pane", children: currentId ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        MeetingDetail,
        {
          uuid: currentId,
          active: !!active,
          meetTag,
          toast,
          onTag: (t) => setMeetTag(meetTag === t ? "" : t),
          onChanged: () => setTick((n) => n + 1),
          onDeleted: () => {
            setSelected("");
            setTick((n) => n + 1);
          },
          onJumpTodo: goLedger
        },
        currentId
      ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "empty", children: "\u9009\u4E00\u573A\u4F1A\u8BAE" }) }),
      showImport ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        ImportSheet,
        {
          toast,
          onClose: () => setShowImport(false),
          onImported: (id) => {
            setShowImport(false);
            setSelected(id);
            setTick((n) => n + 1);
          }
        }
      ) : null
    ] });
  }

  // src/client/ledger.jsx
  var import_react4 = __toESM(require_react(), 1);
  var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
  function CatPills(props) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "cat-pills", children: (props.cats || []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: props.value === c ? "on" : "", onClick: () => props.onChange(c), children: c }, c)) });
  }
  function MeetingPicker(props) {
    const [q, setQ] = (0, import_react4.useState)("");
    const [meetings, setMeetings] = (0, import_react4.useState)([]);
    const qDebounced = useDebounced(q, 220);
    (0, import_react4.useEffect)(() => {
      api("/api/meetings" + qs({ q: qDebounced, limit: 40 })).then((r) => {
        setMeetings(r && r.items || []);
      }).catch(() => {
      });
    }, [qDebounced]);
    (0, import_react4.useEffect)(() => {
      const id = props.defaultMeetingId;
      if (!id) return void 0;
      api("/api/meetings" + qs({ id, limit: 1 })).then((r) => {
        const one = r && r.items && r.items[0];
        if (!one) return;
        setMeetings((prev) => prev.some((m) => m.taskUuid === one.taskUuid) ? prev : [one].concat(prev));
      }).catch(() => {
      });
    }, [props.defaultMeetingId]);
    const options = meetings.slice();
    if (props.value && !options.some((m) => m.taskUuid === props.value)) {
      const cur = meetings.find((m) => m.taskUuid === props.value);
      if (cur) options.unshift(cur);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u6240\u5C5E\u4F1A\u8BAE" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "text", placeholder: "\u8FC7\u6EE4\u4F1A\u8BAE\u6807\u9898", value: q, onChange: (ev) => setQ(ev.target.value), style: { marginBottom: 6 } }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { value: props.value, onChange: (ev) => props.onChange(ev.target.value), children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: meetings.length ? "\u9009\u62E9\u4F1A\u8BAE" : "\u6CA1\u6709\u4F1A\u8BAE" }),
        options.map((m) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: m.taskUuid, children: m.title }, m.taskUuid))
      ] })
    ] });
  }
  function TodoInspector(props) {
    const cats = props.cats || ["\u5176\u4ED6"];
    const item = props.item;
    const composing = props.composing;
    const titleRef = (0, import_react4.useRef)(null);
    const [title, setTitle] = (0, import_react4.useState)(composing ? "" : item && item.title || "");
    const [owner, setOwner] = (0, import_react4.useState)(composing ? "" : item && item.owner || "");
    const [cat, setCat] = (0, import_react4.useState)(composing ? cats.includes("\u5176\u4ED6") ? "\u5176\u4ED6" : cats[0] || "\u5176\u4ED6" : item && item.cat || "\u5176\u4ED6");
    const [due, setDue] = (0, import_react4.useState)(composing ? "" : item && item.due || "");
    const [meetingId, setMeetingId] = (0, import_react4.useState)(props.defaultMeetingId || "");
    const [busy, setBusy] = (0, import_react4.useState)(false);
    (0, import_react4.useEffect)(() => {
      if (composing && titleRef.current) titleRef.current.focus();
    }, [composing]);
    const saveField = (fields) => {
      if (composing || !item) return;
      props.onPatch(item.id, fields);
    };
    const submitNew = () => {
      if (busy) return;
      if (!title.trim()) {
        props.toast("\u5148\u5199\u5F85\u529E\u4E8B\u9879");
        return;
      }
      if (!meetingId) {
        props.toast("\u9009\u51FA\u6240\u5C5E\u4F1A\u8BAE");
        return;
      }
      setBusy(true);
      api("/api/todos", {
        title: title.trim(),
        meetingId,
        owner: owner.trim(),
        cat,
        due: due.trim(),
        origin: "\u624B\u5DE5"
      }).then((r) => {
        props.toast("\u5DF2\u6DFB\u52A0");
        props.onCreated(r.item || { id: r.id });
      }).catch((err) => props.toast(String(err && err.message || err))).finally(() => setBusy(false));
    };
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "formcol", children: [
      composing ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        TitleInput,
        {
          inputRef: titleRef,
          value: title,
          placeholder: "\u65B0\u5F85\u529E",
          autoFocus: true,
          onChange: setTitle,
          onCommit: () => {
          },
          onCancel: () => setTitle(""),
          onEnter: submitNew
        }
      ) : null,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u8D23\u4EFB\u4EBA" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "text",
            placeholder: "\u53EF\u7A7A",
            value: owner,
            onChange: (ev) => setOwner(ev.target.value),
            onBlur: () => {
              if (!composing && owner.trim() !== (item.owner || "")) saveField({ owner: owner.trim() });
            },
            onKeyDown: (ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                composing ? submitNew() : ev.currentTarget.blur();
              }
            }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5F52\u7C7B" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          CatPills,
          {
            cats,
            value: cat,
            onChange: (c) => {
              setCat(c);
              if (!composing) saveField({ cat: c });
            }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u65F6\u9650" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "text",
            placeholder: "\u53EF\u7A7A",
            value: due,
            onChange: (ev) => setDue(ev.target.value),
            onBlur: () => {
              if (!composing && due.trim() !== (item.due || "")) saveField({ due: due.trim() });
            },
            onKeyDown: (ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                composing ? submitNew() : ev.currentTarget.blur();
              }
            }
          }
        )
      ] }),
      composing ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MeetingPicker, { value: meetingId, onChange: setMeetingId, defaultMeetingId: props.defaultMeetingId }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "origin", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u6765\u6E90" }),
          "\u3000",
          originLabel(item.origin),
          item.created ? " \xB7 " + fmtDateTime(item.created) : ""
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u4F1A\u8BAE" }),
          "\u3000",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "linkish", onClick: () => props.goMeet(item.meetingId), children: item.meeting })
        ] })
      ] }),
      composing ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "primary", onClick: submitNew, disabled: busy, children: busy ? "\u6DFB\u52A0\u4E2D" : "\u6DFB\u52A0" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "quiet", onClick: props.onCancel, children: "\u53D6\u6D88" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "quiet danger", onClick: props.onDelete, children: "\u5220\u9664" })
    ] });
  }
  function LedgerPage(props) {
    const { selected, setSelected, toast, goMeet } = props;
    const [items, setItems] = (0, import_react4.useState)(null);
    const [meta, setMeta] = (0, import_react4.useState)({ total: 0, open: 0, cats: ["\u9879\u76EE", "\u90E8\u95E8", "\u516C\u53F8", "\u5176\u4ED6"], catCounts: {}, nextCursor: null, filteredTotal: 0, selected: null });
    const [err, setErr] = (0, import_react4.useState)(null);
    const [catFilter, setCatFilter] = (0, import_react4.useState)("all");
    const [stFilter, setStFilter] = (0, import_react4.useState)("open");
    const [todoQuery, setTodoQuery] = (0, import_react4.useState)("");
    const qDebounced = useDebounced(todoQuery, 280);
    const [composing, setComposing] = (0, import_react4.useState)(false);
    const [composeKey, setComposeKey] = (0, import_react4.useState)(0);
    const [addingCat, setAddingCat] = (0, import_react4.useState)(false);
    const [confirmDel, setConfirmDel] = (0, import_react4.useState)(false);
    const [delBusy, setDelBusy] = (0, import_react4.useState)(false);
    const [moreBusy, setMoreBusy] = (0, import_react4.useState)(false);
    const reqId = (0, import_react4.useRef)(0);
    const load = (0, import_react4.useCallback)((opts = {}) => {
      const id = ++reqId.current;
      const append = !!opts.append;
      if (append) setMoreBusy(true);
      return api("/api/todos" + qs({
        q: qDebounced,
        status: stFilter,
        cat: catFilter === "all" ? "" : catFilter,
        cursor: opts.cursor || "",
        limit: TODO_PAGE
      })).then((r) => {
        if (id !== reqId.current) return;
        const next = r.items || [];
        setErr(null);
        if (!append) setComposing(false);
        setMeta((prev) => ({
          total: r.total || 0,
          open: r.open || 0,
          cats: r.cats || ["\u9879\u76EE", "\u90E8\u95E8", "\u516C\u53F8", "\u5176\u4ED6"],
          catCounts: r.catCounts || {},
          nextCursor: r.nextCursor || null,
          filteredTotal: r.filteredTotal || 0,
          selected: append ? prev.selected : null
        }));
        setItems((prev) => {
          if (!append) return next;
          const seen = new Set((prev || []).map((x) => x.id));
          return (prev || []).concat(next.filter((x) => !seen.has(x.id)));
        });
      }).catch((er) => {
        if (id !== reqId.current) return;
        if (!append) setErr(String(er && er.message || er));
        else toast(String(er && er.message || er));
      }).finally(() => {
        if (append) setMoreBusy(false);
      });
    }, [stFilter, catFilter, qDebounced]);
    (0, import_react4.useEffect)(() => {
      if (props.active) load();
    }, [load, props.active]);
    (0, import_react4.useEffect)(() => {
      if (!selected || !items || composing) return void 0;
      if (items.some((x) => x.id === selected)) return void 0;
      let alive = true;
      api("/api/todos" + qs({ id: selected, status: "all", limit: 1 })).then((r) => {
        if (!alive || !r.selected) return;
        setMeta((m) => ({ ...m, selected: r.selected }));
        setItems((prev) => {
          if (!prev || prev.some((x) => x.id === r.selected.id)) return prev;
          return [r.selected].concat(prev);
        });
      }).catch(() => {
      });
      return () => {
        alive = false;
      };
    }, [selected, items, composing]);
    if (err) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pane", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "empty", children: err }) });
    if (!items) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pane", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "empty", children: "\u52A0\u8F7D\u4E2D\u2026" }) });
    const cats = meta.cats;
    const listed = items.find((x) => x.id === selected) || meta.selected || items[0];
    const current = composing ? null : listed;
    const remain = Math.max(0, (meta.filteredTotal || 0) - items.length);
    const patchLocal = (id, fields) => {
      setItems((prev) => (prev || []).map((x) => x.id === id ? { ...x, ...fields } : x));
      setMeta((m) => m.selected && m.selected.id === id ? { ...m, selected: { ...m.selected, ...fields } } : m);
    };
    const onPatch = (id, fields) => {
      const prev = (items || []).find((x) => x.id === id) || meta.selected;
      patchLocal(id, fields);
      api("/api/todos", { id, ...fields }, "PATCH").catch((er) => {
        if (prev) patchLocal(id, prev);
        toast(String(er && er.message || er));
      });
    };
    const toggleStatus = (x, ev) => {
      if (ev) ev.stopPropagation();
      const next = x.status === "done" ? "open" : "done";
      const prevStatus = x.status;
      patchLocal(x.id, { status: next });
      setMeta((m) => ({ ...m, open: Math.max(0, m.open + (next === "open" ? 1 : -1)) }));
      if (composing) {
        setComposing(false);
        setSelected(x.id);
      }
      api("/api/todos", { id: x.id, status: next }, "PATCH").catch((er) => {
        patchLocal(x.id, { status: prevStatus });
        setMeta((m) => ({ ...m, open: Math.max(0, m.open + (prevStatus === "open" ? 1 : -1)) }));
        toast(String(er && er.message || er));
      });
    };
    const addCat = (name) => {
      const n = String(name || "").trim();
      if (!n) {
        setAddingCat(false);
        return;
      }
      api("/api/todo-cats", { name: n }).then(() => {
        setAddingCat(false);
        setMeta((m) => ({ ...m, cats: m.cats.includes(n) ? m.cats : m.cats.concat(n), catCounts: { ...m.catCounts, [n]: m.catCounts[n] || 0 } }));
      }).catch((er) => toast(String(er && er.message || er)));
    };
    const doDeleteTodo = () => {
      if (!current || delBusy) return;
      setDelBusy(true);
      const id = current.id;
      const wasOpen = current.status === "open";
      api("/api/todos/delete", { id }).then(() => {
        toast("\u5DF2\u5220\u9664");
        setConfirmDel(false);
        setSelected(0);
        setItems((prev) => (prev || []).filter((x) => x.id !== id));
        setMeta((m) => ({
          ...m,
          selected: null,
          total: Math.max(0, m.total - 1),
          open: Math.max(0, m.open - (wasOpen ? 1 : 0)),
          filteredTotal: Math.max(0, m.filteredTotal - 1)
        }));
      }).catch((er) => toast(String(er && er.message || er))).finally(() => setDelBusy(false));
    };
    const startCompose = () => {
      setComposing(true);
      setComposeKey((n) => n + 1);
    };
    const onCreated = (item) => {
      setComposing(false);
      if (item && item.id) {
        setSelected(item.id);
        if (item.title) {
          setItems((prev) => {
            const list = prev || [];
            if (list.some((x) => x.id === item.id)) return list;
            return [item].concat(list);
          });
          setMeta((m) => ({ ...m, total: m.total + 1, open: m.open + 1, filteredTotal: m.filteredTotal + 1 }));
        }
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "ledger", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "cats", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "\u5F52\u7C7B" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "cat" + (catFilter === "all" ? " on" : ""), onClick: () => setCatFilter("all"), children: [
          "\u5168\u90E8 ",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "n", children: meta.total })
        ] }),
        cats.map((c) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "cat" + (catFilter === c ? " on" : ""), onClick: () => setCatFilter(c), children: [
          c + " ",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "n", children: meta.catCounts[c] || 0 })
        ] }, c)),
        addingCat ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          InlineComposer,
          {
            placeholder: "\u5F52\u7C7B\u540D\u79F0",
            submitLabel: "\u6DFB\u52A0",
            compact: true,
            onSubmit: addCat,
            onCancel: () => setAddingCat(false)
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "quiet", style: { marginTop: 12 }, onClick: () => setAddingCat(true), children: "+ \u5F52\u7C7B" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "pane", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "doc-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { children: "\u5F85\u529E" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "lede", children: meta.open + " \u9879\u672A\u5173\u95ED" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "quiet", onClick: startCompose, children: "+ \u5F85\u529E" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "filters", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: stFilter === "open" ? "on" : "", onClick: () => setStFilter("open"), children: "\u672A\u5173\u95ED" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: stFilter === "done" ? "on" : "", onClick: () => setStFilter("done"), children: "\u5DF2\u5173\u95ED" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: stFilter === "all" ? "on" : "", onClick: () => setStFilter("all"), children: "\u5168\u90E8" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            type: "text",
            placeholder: "\u8FC7\u6EE4\u4E8B\u9879\u3001\u8D23\u4EFB\u4EBA\u6216\u4F1A\u8BAE",
            value: todoQuery,
            onChange: (ev) => setTodoQuery(ev.target.value),
            style: { marginBottom: 8 }
          }
        ),
        items.length ? items.map((x) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            className: "row" + (!composing && current && x.id === current.id ? " sel" : "") + (x.status === "done" ? " closed" : ""),
            onClick: () => {
              setComposing(false);
              setSelected(x.id);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CheckMark, { on: x.status === "done", onClick: (ev) => toggleStatus(x, ev) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  TodoRowTitle,
                  {
                    title: x.title,
                    toast,
                    onFocus: () => {
                      setComposing(false);
                      setSelected(x.id);
                    },
                    onSave: (title) => onPatch(x.id, { title })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "src", children: x.meeting })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "who", children: x.owner })
            ]
          },
          x.id
        )) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "empty", children: qDebounced ? "\u6CA1\u6709\u5339\u914D\u7684\u5F85\u529E" : "\u6CA1\u6709\u5F85\u529E" }),
        meta.nextCursor ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "more-row", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "quiet", disabled: moreBusy, onClick: () => load({ append: true, cursor: meta.nextCursor }), children: moreBusy ? "\u52A0\u8F7D\u4E2D" : "\u540E\u9762\u8FD8\u6709 " + remain + " \u6761" }) }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "pane", children: composing ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        TodoInspector,
        {
          composing: true,
          cats,
          toast,
          defaultMeetingId: listed && listed.meetingId || "",
          onCreated,
          onCancel: () => setComposing(false)
        },
        "new-" + composeKey
      ) : current ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        TodoInspector,
        {
          item: current,
          cats,
          toast,
          goMeet,
          onPatch,
          onDelete: () => setConfirmDel(true)
        },
        current.id
      ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "empty", children: "\u9009\u4E00\u6761\u5F85\u529E" }) }),
      confirmDel && current ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        ConfirmSheet,
        {
          title: "\u5220\u9664\u5F85\u529E",
          lede: "\u4ECE\u672C\u673A\u53F0\u8D26\u53BB\u6389\u300C" + current.title + "\u300D\u3002\u6765\u6E90\u4FA7\u7684\u5F85\u529E\u4E0D\u4F1A\u52A8\u3002",
          confirmLabel: "\u5220\u9664",
          danger: true,
          busy: delBusy,
          onConfirm: doDeleteTodo,
          onClose: () => {
            if (!delBusy) setConfirmDel(false);
          }
        }
      ) : null
    ] });
  }

  // src/client/settings.jsx
  var import_react5 = __toESM(require_react(), 1);
  var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
  var GLOSSARY_TABS = [
    { id: "people", label: "\u4EBA", add: "+ \u4EBA", namePh: "\u6B63\u5F0F\u59D3\u540D", aliasPh: "\u52C7\u54E5\u3001\u6797\u54E5" },
    { id: "projects", label: "\u9879\u76EE", add: "+ \u9879\u76EE", namePh: "\u6B63\u5F0F\u9879\u76EE\u540D", aliasPh: "\u7B80\u79F0\u3001\u53E3\u8FF0", codePh: "\u7F16\u53F7\uFF0C\u53EF\u7A7A" },
    { id: "terms", label: "\u7528\u8BED", add: "+ \u7528\u8BED", namePh: "\u6807\u51C6\u5199\u6CD5", aliasPh: "\u542C\u9519\u3001\u8FD1\u97F3" }
  ];
  function splitAliases(v) {
    return String(v || "").split(/[、，,;；/|]+/).map((s) => s.trim()).filter(Boolean);
  }
  function newClassifyRule() {
    return { id: "r-" + Date.now().toString(36), type: "\u9879\u76EE", title: "", people: "", record: "", tags: "" };
  }
  function sharedAliasSet(rows) {
    const map = /* @__PURE__ */ new Map();
    for (const r of rows || []) {
      const name = String(r.name || "").trim().toLowerCase();
      for (const a of splitAliases(r.aliases)) {
        const k = a.toLowerCase();
        if (!map.has(k)) map.set(k, /* @__PURE__ */ new Set());
        if (name) map.get(k).add(name);
      }
    }
    const shared = /* @__PURE__ */ new Set();
    for (const [k, names] of map) {
      if (names.size > 1) shared.add(k);
    }
    return shared;
  }
  function foldText(s) {
    return String(s || "").trim().toLowerCase();
  }
  function rowMatchesQuery(row, q) {
    if (!q) return true;
    const hay = [row && row.name, row && row.code, row && row.aliases].map(foldText).join(" ");
    if (!hay.trim()) return true;
    return hay.includes(q);
  }
  function SettingsPage(props) {
    const toast = props.toast;
    const [tab, setTab] = (0, import_react5.useState)(() => {
      try {
        return sessionStorage.getItem("ma-settings-tab") || "people";
      } catch {
        return "people";
      }
    });
    const [st, setSt] = (0, import_react5.useState)(null);
    const [err, setErr] = (0, import_react5.useState)(null);
    const [people, setPeople] = (0, import_react5.useState)([]);
    const [projects, setProjects] = (0, import_react5.useState)([]);
    const [terms, setTerms] = (0, import_react5.useState)([]);
    const [glossaryKind, setGlossaryKind] = (0, import_react5.useState)(() => {
      try {
        return sessionStorage.getItem("ma-glossary-kind") || "people";
      } catch {
        return "people";
      }
    });
    const [llm, setLlm] = (0, import_react5.useState)({ preset: "deepseek", baseUrl: "", model: "", apiKey: "" });
    const [kb, setKb] = (0, import_react5.useState)({ url: "", apiKey: "", datasets: { mgmt: "", ops: "", project: "", dept: "" } });
    const [testing, setTesting] = (0, import_react5.useState)("");
    const [testMsg, setTestMsg] = (0, import_react5.useState)("");
    const [logs, setLogs] = (0, import_react5.useState)([]);
    const [mcpBusy, setMcpBusy] = (0, import_react5.useState)(false);
    const [writebackBusy, setWritebackBusy] = (0, import_react5.useState)(false);
    const [classifyBusy, setClassifyBusy] = (0, import_react5.useState)(false);
    const [classify, setClassify] = (0, import_react5.useState)({ projectFromGlossary: true, rules: [] });
    const [confirmClassify, setConfirmClassify] = (0, import_react5.useState)(false);
    const [confirmRotate, setConfirmRotate] = (0, import_react5.useState)(false);
    const [confirmFull, setConfirmFull] = (0, import_react5.useState)(false);
    const [syncBusy, setSyncBusy] = (0, import_react5.useState)(false);
    const [syncSt, setSyncSt] = (0, import_react5.useState)(null);
    const waitSync = (0, import_react5.useRef)(false);
    const syncStartedAt = (0, import_react5.useRef)(0);
    const projectFileRef = (0, import_react5.useRef)(null);
    const zipFileRef = (0, import_react5.useRef)(null);
    const [importBusy, setImportBusy] = (0, import_react5.useState)(false);
    const [ht, setHt] = (0, import_react5.useState)({ url: "", apiKey: "" });
    const [htMsg, setHtMsg] = (0, import_react5.useState)("");
    const [glossaryQuery, setGlossaryQuery] = (0, import_react5.useState)("");
    const appUp = props.appUp;
    const [verBusy, setVerBusy] = (0, import_react5.useState)(false);
    const [verErr, setVerErr] = (0, import_react5.useState)("");
    (0, import_react5.useEffect)(() => {
      try {
        sessionStorage.setItem("ma-settings-tab", tab);
      } catch {
      }
    }, [tab]);
    (0, import_react5.useEffect)(() => {
      try {
        sessionStorage.setItem("ma-glossary-kind", glossaryKind);
      } catch {
      }
    }, [glossaryKind]);
    (0, import_react5.useEffect)(() => {
      if (tab !== "ver" || appUp || !props.onCheckUpdate) return void 0;
      setVerBusy(true);
      setVerErr("");
      props.onCheckUpdate(false).catch((er) => setVerErr(String(er && er.message || er))).finally(() => setVerBusy(false));
    }, [tab]);
    const checkVersion = (fresh) => {
      if (verBusy || !props.onCheckUpdate) return;
      setVerBusy(true);
      setVerErr("");
      props.onCheckUpdate(fresh).then((r) => {
        toast(r && r.message || (fresh ? "\u5DF2\u68C0\u67E5" : ""));
      }).catch((er) => {
        const msg = String(er && er.message || er);
        setVerErr(msg);
        toast(msg);
      }).finally(() => setVerBusy(false));
    };
    const apply = (r) => {
      setSt(r);
      setPeople(r.people || []);
      setProjects((r.projects || []).map((p) => ({ name: p.name || "", aliases: p.aliases || "", code: p.code || "" })));
      setTerms(r.terms || []);
      const L = r.llm || {};
      setLlm({ preset: L.preset || "deepseek", baseUrl: L.baseUrl || "", model: L.model || "", apiKey: "" });
      const K = r.kb || {};
      setKb({
        url: K.url || "",
        apiKey: "",
        datasets: Object.assign({ mgmt: "", ops: "", project: "", dept: "" }, K.datasets || {})
      });
      const H = r.ht || {};
      setHt({ url: H.url || "", apiKey: "" });
      const C = r.classify || {};
      setClassify({
        projectFromGlossary: C.projectFromGlossary !== false,
        rules: Array.isArray(C.rules) ? C.rules : []
      });
    };
    (0, import_react5.useEffect)(() => {
      api("/api/settings").then(apply).catch((er) => setErr(String(er && er.message || er)));
      api("/api/logs?limit=200").then((r) => setLogs(r.items || [])).catch(() => {
      });
      api("/api/sync-status").then(setSyncSt).catch(() => {
      });
    }, []);
    (0, import_react5.useEffect)(() => {
      if (tab !== "logs" && tab !== "sync" && !syncBusy) return void 0;
      const load = () => {
        if (tab === "logs") api("/api/logs?limit=200").then((r) => setLogs(r.items || [])).catch(() => {
        });
        api("/api/sync-status?meta=1").then((r) => {
          setSyncSt((prev) => ({
            ...r || {},
            sources: r && r.sources && Object.keys(r.sources).length ? r.sources : prev && prev.sources || {},
            dws: r && r.dws || prev && prev.dws
          }));
          if (!waitSync.current || !r || r.syncing) return;
          const lastAt = r.last && r.last.at || 0;
          if (lastAt < syncStartedAt.current) return;
          waitSync.current = false;
          setSyncBusy(false);
          if (r.last && r.last.message) toast(r.last.message);
        }).catch(() => {
        });
      };
      load();
      const t = setInterval(load, 2e3);
      return () => clearInterval(t);
    }, [tab, syncBusy, toast]);
    const setKindRows = (kind, next) => {
      if (kind === "people") setPeople(next);
      else if (kind === "projects") setProjects(next);
      else setTerms(next);
    };
    const persistKind = (kind, next) => {
      setKindRows(kind, next);
      return api("/api/settings", { [kind]: next }).then((r) => {
        setSt(r);
        setKindRows(kind, r[kind] || []);
        return r;
      }).catch((er) => {
        toast(String(er && er.message || er));
        throw er;
      });
    };
    const importProjectCsv = (file) => {
      if (!file || importBusy) return;
      setImportBusy(true);
      const reader = new FileReader();
      reader.onload = () => {
        api("/api/settings/projects-import", { csv: String(reader.result || "") }).then((r) => {
          apply(r);
          const im = r.import || {};
          const parts = [];
          if (im.added) parts.push("\u65B0\u589E " + im.added);
          if (im.updated) parts.push("\u66F4\u65B0 " + im.updated);
          if (im.skipped) parts.push("\u8DF3\u8FC7 " + im.skipped);
          toast(parts.length ? "\u5DF2\u5BFC\u5165 \xB7 " + parts.join("\uFF0C") : "\u6CA1\u6709\u65B0\u9879\u76EE");
        }).catch((er) => toast(String(er && er.message || er))).finally(() => setImportBusy(false));
      };
      reader.onerror = () => {
        toast("\u8BFB\u4E0D\u4E86\u8FD9\u4E2A\u6587\u4EF6");
        setImportBusy(false);
      };
      reader.readAsText(file, "UTF-8");
    };
    const doFullSync = () => {
      if (syncBusy) return;
      setSyncBusy(true);
      setConfirmFull(false);
      waitSync.current = true;
      syncStartedAt.current = Date.now();
      api("/api/sync", { full: true }).then((r) => {
        toast(r.message || "\u5F00\u59CB\u5168\u91CF\u540C\u6B65");
        setSyncSt((prev) => ({ ...prev || {}, syncing: true }));
      }).catch((er) => {
        waitSync.current = false;
        toast(String(er && er.message || er));
        setSyncBusy(false);
      });
    };
    const saveLlm = () => {
      const body = { preset: llm.preset, baseUrl: llm.baseUrl, model: llm.model };
      if (llm.apiKey.trim()) body.apiKey = llm.apiKey.trim();
      api("/api/settings", { llm: body }).then((r) => {
        apply(r);
        toast("\u5DF2\u4FDD\u5B58");
      }).catch((er) => toast(String(er && er.message || er)));
    };
    const saveKb = () => {
      const body = { url: kb.url, datasets: kb.datasets };
      if (kb.apiKey.trim()) body.apiKey = kb.apiKey.trim();
      api("/api/settings", { kb: body }).then((r) => {
        apply(r);
        toast("\u5DF2\u4FDD\u5B58");
      }).catch((er) => toast(String(er && er.message || er)));
    };
    const saveHt = () => {
      const body = { url: ht.url };
      if (ht.apiKey.trim()) body.apiKey = ht.apiKey.trim();
      api("/api/settings", { ht: body }).then((r) => {
        apply(r);
        toast("\u5DF2\u4FDD\u5B58");
      }).catch((er) => toast(String(er && er.message || er)));
    };
    const testHt = () => {
      setTesting("ht");
      setHtMsg("");
      api("/api/settings/ht-test", {}).then((r) => {
        if (!r.ok) {
          setHtMsg(r.error || "\u4E0D\u901A");
          return;
        }
        const bits = [];
        if (r.caller) bits.push(r.caller);
        bits.push("\u89C1\u5230 " + (r.count || 0) + " \u4E2A\u9879\u76EE");
        setHtMsg("\u53EF\u7528 \xB7 " + bits.join(" \xB7 "));
      }).catch((er) => setHtMsg(String(er && er.message || er))).finally(() => setTesting(""));
    };
    const syncHtProjects = () => {
      setTesting("ht-sync");
      setHtMsg("");
      api("/api/settings/projects-sync", {}).then((r) => {
        apply(r);
        const im = r.import || {};
        const parts = [];
        if (im.matched != null) parts.push("\u547D\u4E2D " + im.matched);
        if (im.added) parts.push("\u65B0\u589E " + im.added);
        if (im.updated) parts.push("\u66F4\u65B0 " + im.updated);
        if (im.skipped) parts.push("\u8DF3\u8FC7 " + im.skipped);
        const text = parts.length ? "\u5DF2\u540C\u6B65 \xB7 " + parts.join("\uFF0C") : "\u6CA1\u6709\u65B0\u9879\u76EE";
        setHtMsg(text);
        toast(text);
      }).catch((er) => setHtMsg(String(er && er.message || er))).finally(() => setTesting(""));
    };
    const setRule = (i, patch) => {
      const n = classify.rules.slice();
      n[i] = { ...n[i], ...patch };
      setClassify({ ...classify, rules: n });
    };
    const saveClassify = () => {
      api("/api/settings", { classify }).then((r) => {
        apply(r);
        toast("\u5DF2\u4FDD\u5B58");
      }).catch((er) => toast(String(er && er.message || er)));
    };
    const runClassifyAll = () => {
      if (classifyBusy) return;
      setClassifyBusy(true);
      api("/api/classify", { all: true }).then((r) => {
        setConfirmClassify(false);
        toast(r.updated ? "\u5DF2\u586B\u5199 " + r.updated + " \u573A" : "\u6CA1\u6709\u573A\u6B21\u88AB\u89C4\u5219\u547D\u4E2D");
      }).catch((er) => toast(String(er && er.message || er))).finally(() => setClassifyBusy(false));
    };
    const setWriteback = (enabled) => {
      if (writebackBusy) return;
      setWritebackBusy(true);
      api("/api/settings", { writeback: { enabled } }).then((r) => {
        apply(r);
        toast(enabled ? "\u5199\u56DE\u5DF2\u6253\u5F00" : "\u5199\u56DE\u5DF2\u5173\u95ED");
      }).catch((er) => toast(String(er && er.message || er))).finally(() => setWritebackBusy(false));
    };
    const setMcp = (body) => {
      if (mcpBusy) return;
      setMcpBusy(true);
      api("/api/settings", { mcp: body }).then((r) => {
        apply(r);
        toast(body.rotateToken ? "\u5DF2\u6362\u5BC6\u94A5" : body.enabled ? "MCP \u5DF2\u6253\u5F00" : "MCP \u5DF2\u5173\u95ED");
      }).catch((er) => toast(String(er && er.message || er))).finally(() => setMcpBusy(false));
    };
    const copyMcp = (text) => {
      const w = typeof window !== "undefined" ? window : globalThis;
      const done = () => toast("\u5DF2\u590D\u5236\uFF0C\u8D34\u5230\u667A\u80FD\u4F53\u7684 MCP \u914D\u7F6E\u91CC");
      if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
        w.navigator.clipboard.writeText(text).then(done).catch(() => {
          fallbackCopy(w, text);
          done();
        });
      } else {
        fallbackCopy(w, text);
        done();
      }
    };
    const pickPreset = (id) => {
      const p = LLM_PRESETS.find((x) => x.id === id);
      setLlm({
        ...llm,
        preset: id,
        baseUrl: p.baseUrl || llm.baseUrl,
        model: id === "custom" ? llm.model : p.model || llm.model
      });
    };
    if (err) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "page", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "empty", children: err }) });
    if (!st) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "page", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "empty", children: "\u52A0\u8F7D\u4E2D\u2026" }) });
    const llmHint = st.llm && st.llm.envLocked ? "\u5F53\u524D\u7531\u73AF\u5883\u53D8\u91CF\u8986\u76D6\u8BBE\u7F6E\u9875\u3002" : st.llm && st.llm.source === "dsh" ? "\u5BC6\u94A5\u4ECD\u6765\u81EA\u672C\u673A DSH \u51ED\u636E\uFF0C\u4FDD\u5B58\u540E\u6539\u7528\u8BBE\u7F6E\u3002" : "";
    const lists = { people, projects, terms };
    const kindMeta = GLOSSARY_TABS.find((x) => x.id === glossaryKind) || GLOSSARY_TABS[0];
    const kindRows = lists[kindMeta.id] || [];
    const shared = sharedAliasSet(kindRows);
    const filterQ = foldText(glossaryQuery);
    const visibleRows = kindRows.map((p, i) => ({ p, i })).filter(({ p }) => rowMatchesQuery(p, filterQ));
    const peoplePane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner" + (kindMeta.id === "projects" ? " wide" : ""), children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u79F0\u547C" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: glossaryKind === "projects" ? "\u6B63\u5F0F\u540D\u7528\u4E8E\u4E0A\u4F20\u548C\u68C0\u7D22\u3002\u53EF\u4ECE\u5916\u90E8\u7CFB\u7EDF\u540C\u6B65\u4F60\u53EF\u89C1\u7684\u9879\u76EE\uFF0C\u6216\u5BFC\u5165\u9879\u76EE\u6E05\u5355 CSV\u3002" : "\u603B\u7ED3\u65F6\u628A\u53E3\u8BED\u3001\u7B80\u79F0\u548C\u542C\u9519\u843D\u5230\u6B63\u5F0F\u5199\u6CD5\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "filters", children: GLOSSARY_TABS.map((x) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          className: glossaryKind === x.id ? "on" : "",
          onClick: () => {
            setGlossaryKind(x.id);
            setGlossaryQuery("");
          },
          children: x.label
        },
        x.id
      )) }),
      kindRows.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "glossary-toolbar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "text",
              placeholder: kindMeta.id === "projects" ? "\u6309\u540D\u79F0\u3001\u7F16\u53F7\u3001\u522B\u540D\u7B5B\u9009" : "\u6309\u540D\u79F0\u3001\u522B\u540D\u7B5B\u9009",
              value: glossaryQuery,
              onChange: (ev) => setGlossaryQuery(ev.target.value)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "n", children: filterQ && visibleRows.length !== kindRows.length ? "\u663E\u793A " + visibleRows.length + " / " + kindRows.length : "\u5171 " + kindRows.length + " \u4E2A" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "glossary-list", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "person person-head" + (kindMeta.id === "projects" ? " has-code" : ""), children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u540D\u79F0" }),
            kindMeta.id === "projects" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u7F16\u53F7" }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u522B\u540D" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", {})
          ] }),
          visibleRows.length ? visibleRows.map(({ p, i }) => {
            const dup = splitAliases(p.aliases).some((a) => shared.has(a.toLowerCase()));
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "person" + (kindMeta.id === "projects" ? " has-code" : ""), children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "input",
                {
                  type: "text",
                  placeholder: kindMeta.namePh,
                  value: p.name,
                  onChange: (ev) => {
                    const n = kindRows.slice();
                    n[i] = { ...n[i], name: ev.target.value };
                    setKindRows(kindMeta.id, n);
                  }
                }
              ),
              kindMeta.id === "projects" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "input",
                {
                  type: "text",
                  placeholder: kindMeta.codePh,
                  value: p.code || "",
                  onChange: (ev) => {
                    const n = kindRows.slice();
                    n[i] = { ...n[i], code: ev.target.value };
                    setKindRows(kindMeta.id, n);
                  }
                }
              ) : null,
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "alias-cell", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                  "input",
                  {
                    type: "text",
                    placeholder: kindMeta.aliasPh,
                    value: p.aliases,
                    onChange: (ev) => {
                      const n = kindRows.slice();
                      n[i] = { ...n[i], aliases: ev.target.value };
                      setKindRows(kindMeta.id, n);
                    }
                  }
                ),
                dup ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dup", children: "\u4E0D\u552F\u4E00" }) : null
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", onClick: () => persistKind(kindMeta.id, kindRows.filter((_, j) => j !== i)), children: "\u5220\u9664" })
            ] }, kindMeta.id + "-" + i);
          }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "empty", children: [
            "\u6CA1\u6709\u5339\u914D\u300C",
            glossaryQuery.trim(),
            "\u300D"
          ] })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "empty", children: "\u8FD8\u6CA1\u6709\u3002\u52A0\u4E00\u884C\u5373\u53EF\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          className: "quiet",
          onClick: () => {
            setGlossaryQuery("");
            setKindRows(kindMeta.id, kindRows.concat([{ name: "", aliases: "", code: "" }]));
          },
          children: kindMeta.add
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "primary", style: { marginLeft: 8 }, onClick: () => persistKind(kindMeta.id, kindRows).then(() => toast("\u5DF2\u4FDD\u5B58")).catch(() => {
      }), children: "\u4FDD\u5B58" }),
      kindMeta.id === "projects" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "block", style: { marginTop: 28 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u5BFC\u5165\u6E05\u5355" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "CSV \u9700\u6709\u300C\u9879\u76EE\u7F16\u53F7\u300D\u300C\u9879\u76EE\u540D\u79F0\u300D\u5217\u3002\u5DF2\u6709\u9879\u76EE\u6309\u7F16\u53F7\u6216\u540D\u79F0\u5408\u5E76\uFF0C\u672C\u5730\u522B\u540D\u4FDD\u7559\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            ref: projectFileRef,
            type: "file",
            accept: ".csv,text/csv",
            style: { display: "none" },
            onChange: (ev) => {
              const f = ev.target.files && ev.target.files[0];
              ev.target.value = "";
              if (f) importProjectCsv(f);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", disabled: importBusy, onClick: () => projectFileRef.current && projectFileRef.current.click(), children: importBusy ? "\u5BFC\u5165\u4E2D\u2026" : "\u5BFC\u5165\u6E05\u5355" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("a", { className: "quiet", href: "/\u9879\u76EE\u6E05\u5355\u6A21\u677F.csv", download: "\u9879\u76EE\u6E05\u5355\u6A21\u677F.csv", children: "\u4E0B\u8F7D\u6A21\u677F" })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "status", style: { marginTop: 28 }, children: "\u603B\u7ED3\u7528\u9ED8\u8BA4\u63D0\u70BC\u89C4\u5219\u3002" })
    ] });
    const llmPane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u5927\u6A21\u578B" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u95EE\u4F1A\u8BAE\u3001\u751F\u6210\u603B\u7ED3\u65F6\u7528\u3002\u76F8\u5173\u7247\u6BB5\u4F1A\u53D1\u5230\u8FD9\u91CC\u3002" }),
      llmHint ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "hint", children: llmHint }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "filters", children: LLM_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: llm.preset === p.id ? "on" : "", onClick: () => pickPreset(p.id), children: p.label }, p.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5730\u5740" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", placeholder: "\u63A5\u53E3\u5730\u5740", value: llm.baseUrl, onChange: (ev) => setLlm({ ...llm, baseUrl: ev.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u6A21\u578B\u540D" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", placeholder: "\u5982 deepseek-chat", value: llm.model, onChange: (ev) => setLlm({ ...llm, model: ev.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5BC6\u94A5" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            type: "password",
            placeholder: st.llm && st.llm.keySet ? "\u5DF2\u4FDD\u5B58" : "\u516C\u53F8\u6216\u4E2A\u4EBA\u63D0\u4F9B",
            value: llm.apiKey,
            onChange: (ev) => setLlm({ ...llm, apiKey: ev.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "primary", onClick: saveLlm, children: "\u4FDD\u5B58" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", disabled: testing === "llm", onClick: () => {
        setTesting("llm");
        setTestMsg("");
        api("/api/settings/llm-test", {}).then((r) => {
          setTestMsg(r.ok ? "\u53EF\u7528 \xB7 " + (r.model || "") + (r.reply ? " \xB7 " + r.reply : "") : r.error || "\u4E0D\u901A");
        }).catch((er) => setTestMsg(String(er && er.message || er))).finally(() => setTesting(""));
      }, children: testing === "llm" ? "\u5728\u6D4B\u2026" : "\u6D4B\u4E00\u4E0B" }),
      testMsg && tab === "llm" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "status", children: testMsg }) : null
    ] });
    const kbPane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u4E0A\u4F20" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u8BE6\u60C5\u91CC\u70B9\u4E0A\u4F20\u65F6\u5199\u5165\u8FD9\u91CC\u3002\u4E00\u53F0 RAGFlow\u3001\u56DB\u4E2A\u5E93\u3002\u9879\u76EE\u4F1A\u8BAE\u8FDB\u540C\u4E00\u4E2A\u5E93\uFF0C\u7528\u9879\u76EE\u540D\uFF08\u53CA\u53EF\u9009\u7F16\u53F7\uFF09\u533A\u5206\uFF0C\u4E0D\u6309\u9879\u76EE\u62C6\u5E93\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5730\u5740" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", placeholder: "RAGFlow \u5730\u5740", value: kb.url, onChange: (ev) => setKb({ ...kb, url: ev.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5BC6\u94A5" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            type: "password",
            placeholder: st.kb && st.kb.keySet ? "\u5DF2\u4FDD\u5B58" : "\u516C\u53F8\u63D0\u4F9B",
            value: kb.apiKey,
            onChange: (ev) => setKb({ ...kb, apiKey: ev.target.value })
          }
        )
      ] }),
      KB_DS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: d.label + " \xB7 dataset id" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            type: "text",
            placeholder: "RAGFlow \u6570\u636E\u96C6 ID",
            value: kb.datasets[d.key] || "",
            onChange: (ev) => setKb({ ...kb, datasets: { ...kb.datasets, [d.key]: ev.target.value } })
          }
        )
      ] }, d.key)),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "primary", onClick: saveKb, children: "\u4FDD\u5B58" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", disabled: testing === "kb", onClick: () => {
        setTesting("kb");
        setTestMsg("");
        api("/api/settings/kb-test", {}).then((r) => {
          setTestMsg(r.ok ? "\u53EF\u7528 \xB7 \u89C1\u5230 " + r.count + " \u4E2A\u5E93" : r.error || "\u4E0D\u901A");
        }).catch((er) => setTestMsg(String(er && er.message || er))).finally(() => setTesting(""));
      }, children: testing === "kb" ? "\u5728\u6D4B\u2026" : "\u6D4B\u4E00\u4E0B" }),
      testMsg && tab === "kb" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "status", children: testMsg }) : null
    ] });
    const extPane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u5916\u90E8\u7CFB\u7EDF" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u63A5\u516C\u53F8\u6570\u667A\u7CFB\u7EDF\uFF0C\u628A\u4F60\u6709\u6743\u770B\u7684\u9879\u76EE\u540C\u6B65\u8FDB\u79F0\u547C\u8868\u3002\u5730\u5740\u548C\u4EE4\u724C\u53EA\u5B58\u5728\u672C\u673A\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "block", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u516C\u53F8\u6570\u667A\u7CFB\u7EDF" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u4EE4\u724C\u5728\u6570\u667A\u7CFB\u7EDF\u300C\u4E2A\u4EBA\u4E2D\u5FC3 \xB7 \u7B2C\u4E09\u65B9\u5E94\u7528\u63A5\u5165\u300D\u521B\u5EFA\u3002\u540C\u6B65\u4F1A\u62C9\u5168\u90E8\u6709\u6548\u9879\u76EE\uFF0C\u672C\u5730\u522B\u540D\u4FDD\u7559\u3002" }),
        st.ht && st.ht.envLocked ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "hint", children: "\u5F53\u524D\u7531\u73AF\u5883\u53D8\u91CF\u8986\u76D6\u8BBE\u7F6E\u9875\u3002" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5730\u5740" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", placeholder: "\u6570\u667A\u7CFB\u7EDF\u5730\u5740\uFF0C\u95EE\u540C\u4E8B\u8981", value: ht.url, onChange: (ev) => setHt({ ...ht, url: ev.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u4EE4\u724C" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "password",
              placeholder: st.ht && st.ht.keySet ? "\u5DF2\u4FDD\u5B58" : "htdc_pat_\u2026",
              value: ht.apiKey,
              onChange: (ev) => setHt({ ...ht, apiKey: ev.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "primary", onClick: saveHt, children: "\u4FDD\u5B58" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", disabled: testing === "ht", onClick: testHt, children: testing === "ht" ? "\u5728\u6D4B\u2026" : "\u6D4B\u4E00\u4E0B" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", disabled: testing === "ht-sync", onClick: syncHtProjects, children: testing === "ht-sync" ? "\u540C\u6B65\u4E2D\u2026" : "\u540C\u6B65\u9879\u76EE" }),
        htMsg ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "status", children: htMsg }) : null
      ] })
    ] });
    const classifyPane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u7C7B\u578B\u89C4\u5219" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u65B0\u542C\u8BB0\u5165\u5E93\u65F6\uFF0C\u6309\u4ECE\u4E0A\u5230\u4E0B\u7B2C\u4E00\u6761\u547D\u4E2D\u7684\u89C4\u5219\u586B\u5199\u7C7B\u578B\u548C\u6807\u7B7E\u3002\u9879\u76EE\u4F1A\u4F1A\u540C\u65F6\u586B\u9879\u76EE\u540D\u3002\u624B\u6539\u8FC7\u7684\u7C7B\u578B\u4E0D\u8986\u76D6\u3002\u5E93\u91CC\u5DF2\u6709\u7684\u8981\u70B9\u300C\u5957\u7528\u5230\u672A\u5B9A\u573A\u6B21\u300D\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "filters", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          className: classify.projectFromGlossary ? "on" : "",
          onClick: () => setClassify({ ...classify, projectFromGlossary: !classify.projectFromGlossary }),
          children: "\u8BCD\u8868\u9879\u76EE"
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "hint", children: classify.projectFromGlossary ? "\u6807\u9898\u6216\u8BB0\u5F55\u547D\u4E2D\u79F0\u547C\u8868\u91CC\u7684\u9879\u76EE\u540D/\u522B\u540D\u65F6\uFF0C\u6807\u4E3A\u300C\u9879\u76EE\u300D\u5E76\u6253\u4E0A\u8BE5\u9879\u76EE\u540D\u3002\u89C4\u5219\u5148\u4E8E\u8FD9\u4E00\u6761\u3002" : "\u4E0D\u81EA\u52A8\u7528\u8BCD\u8868\u9879\u76EE\u540D\u8BC6\u522B\u3002" }),
      (classify.rules || []).map((rule, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rule", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "rule-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "n", children: i + 1 }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "cat-pills", children: MEETING_TYPES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: rule.type === s ? "on" : "", onClick: () => setRule(i, { type: s }), children: s }, s)) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", disabled: i === 0, onClick: () => {
            const n = classify.rules.slice();
            const t = n[i - 1];
            n[i - 1] = n[i];
            n[i] = t;
            setClassify({ ...classify, rules: n });
          }, children: "\u4E0A\u79FB" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", disabled: i === classify.rules.length - 1, onClick: () => {
            const n = classify.rules.slice();
            const t = n[i + 1];
            n[i + 1] = n[i];
            n[i] = t;
            setClassify({ ...classify, rules: n });
          }, children: "\u4E0B\u79FB" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", onClick: () => setClassify({ ...classify, rules: classify.rules.filter((_, j) => j !== i) }), children: "\u5220\u9664" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u6807\u9898\u542B\uFF08\u4EFB\u4E00\uFF09" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", placeholder: "\u5468\u4F1A\u3001\u7BA1\u7406\u4F1A", value: rule.title || "", onChange: (ev) => setRule(i, { title: ev.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u53C2\u4F1A\u4EBA\u90FD\u8981\u6709" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", placeholder: "\u90D1\u52C7\u3001\u5F90\u6797\uFF1B\u53EF\u7528\u522B\u540D", value: rule.people || "", onChange: (ev) => setRule(i, { people: ev.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u8BB0\u5F55\u542B\uFF08\u4EFB\u4E00\uFF09" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", placeholder: "\u7EAA\u8981\u91CC\u7684\u8BCD", value: rule.record || "", onChange: (ev) => setRule(i, { record: ev.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5E76\u6253\u6807\u7B7E" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", placeholder: "\u9879\u76EE\u540D\u6216\u90E8\u95E8\uFF0C\u53EF\u7A7A", value: rule.tags || "", onChange: (ev) => setRule(i, { tags: ev.target.value }) })
        ] })
      ] }, rule.id || i)),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", onClick: () => setClassify({ ...classify, rules: classify.rules.concat([newClassifyRule()]) }), children: "+ \u89C4\u5219" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "primary", style: { marginLeft: 8 }, onClick: saveClassify, children: "\u4FDD\u5B58" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", disabled: classifyBusy, onClick: () => setConfirmClassify(true), children: "\u5957\u7528\u89C4\u5219" }),
      confirmClassify ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        ConfirmSheet,
        {
          title: "\u6309\u89C4\u5219\u586B\u5199\u7C7B\u578B",
          lede: "\u53EA\u6539\u672A\u5B9A\u7684\uFF0C\u4EE5\u53CA\u4EE5\u524D\u7531\u89C4\u5219\u586B\u8FC7\u7684\u3002\u4F60\u624B\u9009\u8FC7\u7C7B\u578B\u7684\u573A\u6B21\u4E0D\u52A8\u3002",
          confirmLabel: "\u5957\u7528",
          busy: classifyBusy,
          onConfirm: runClassifyAll,
          onClose: () => {
            if (!classifyBusy) setConfirmClassify(false);
          }
        }
      ) : null
    ] });
    const mcp = st.mcp || {};
    const mcpPane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "MCP" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u6253\u5F00\u540E\uFF0C\u672C\u673A\u667A\u80FD\u4F53\u53EF\u7528\u4F1A\u8BAE\u95EE\u7B54\u3001\u5217\u8868\u3001\u5F85\u529E\u548C\u66F4\u65B0\u542C\u8BB0\u3002\u53EA\u76D1\u542C 127.0.0.1\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "filters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: mcp.enabled ? "on" : "", disabled: mcpBusy, onClick: () => setMcp({ enabled: true }), children: "\u6253\u5F00" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: !mcp.enabled ? "on" : "", disabled: mcpBusy, onClick: () => setMcp({ enabled: false }), children: "\u5173\u95ED" })
      ] }),
      mcp.enabled && mcp.snippet ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "hint", children: "\u590D\u5236\u4E0B\u9762\u8FD9\u4E00\u6BB5\uFF0C\u8D34\u8FDB\u667A\u80FD\u4F53\u7684 MCP \u914D\u7F6E\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("pre", { className: "mcp-snip", children: mcp.snippet }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "primary", onClick: () => copyMcp(mcp.snippet), children: "\u590D\u5236" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", onClick: () => setConfirmRotate(true), children: "\u6362\u5BC6\u94A5" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "hint", children: "\u5148\u6253\u5F00\uFF0C\u518D\u590D\u5236\u914D\u7F6E\u3002" }),
      confirmRotate ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        ConfirmSheet,
        {
          title: "\u6362 MCP \u5BC6\u94A5",
          lede: "\u5DF2\u7ECF\u914D\u8FC7\u7684\u667A\u80FD\u4F53\u8981\u91CD\u65B0\u8D34\u4E00\u6BB5\u914D\u7F6E\u3002\u65E7\u5BC6\u94A5\u7ACB\u523B\u5931\u6548\u3002",
          confirmLabel: "\u6362\u5BC6\u94A5",
          onConfirm: () => {
            setConfirmRotate(false);
            setMcp({ rotateToken: true });
          },
          onClose: () => setConfirmRotate(false)
        }
      ) : null
    ] });
    const pulling = syncBusy || !!(syncSt && syncSt.syncing);
    const writeback = st.writeback || { enabled: true };
    const sourceMap = syncSt && syncSt.sources || {};
    const sourceCards = [
      { id: "dingtalk", label: "\u9489\u9489", hint: "\u626B\u7801\u767B\u5F55\u540E\u62C9 AI \u542C\u8BB0\u3002\u53EF\u5199\u56DE\u6807\u9898\u548C\u8BB0\u5F55\u3002", install: "npm \u4F1A\u968F\u5B89\u88C5\u811A\u672C\u88C5 dws" },
      { id: "feishu", label: "\u98DE\u4E66", hint: "\u8981\u8FC7\u4E24\u9875\uFF1A\u5148\u521B\u5EFA\u5E94\u7528\uFF0C\u518D\u6388\u6743\u5999\u8BB0\u3002\u53EF\u5199\u56DE\u6807\u9898\u548C\u603B\u7ED3\u3002", install: "npm install -g @larksuite/cli" },
      { id: "tencent", label: "\u817E\u8BAF\u4F1A\u8BAE", hint: "\u626B\u7801\u767B\u5F55\u540E\u62C9\u5F55\u5236\u667A\u80FD\u7EAA\u8981\u548C\u5143\u5B9D\u7EAA\u8981\u3002\u53EA\u8BFB\uFF0C\u4E0D\u5199\u56DE\u3002", install: "npm install -g @tencentcloud/tmeet" }
    ];
    const loginSource = (id) => {
      api("/api/sources/login", { provider: id }).then((r) => {
        toast(r && r.message || "\u8BF7\u5B8C\u6210\u6388\u6743");
      }).catch((er) => toast(String(er && er.message || er)));
    };
    const syncPane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u542C\u8BB0" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u9489\u9489\u3001\u98DE\u4E66\u3001\u817E\u8BAF\u8C01\u767B\u5F55\u4E86\u5C31\u62C9\u8C01\u3002\u5199\u56DE\u53EA\u4F5C\u7528\u4E8E\u652F\u6301\u6539\u6807\u9898/\u7EAA\u8981\u7684\u6765\u6E90\u3002" }),
      sourceCards.map((card) => {
        const s = sourceMap[card.id] || {};
        return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: card.label }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: card.hint }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "status", children: s.authenticated ? "\u5DF2\u767B\u5F55" + (s.user ? " \xB7 " + s.user : "") : s.error || "\u672A\u767B\u5F55" }),
          s.authenticated ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "quiet", onClick: () => loginSource(card.id), children: "\u767B\u5F55" }),
          !s.authenticated && /未安装/.test(s.error || "") ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: card.install }) : null
        ] }, card.id);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "block", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u5199\u56DE\u6765\u6E90" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u6253\u5F00\u540E\uFF0C\u4FDD\u5B58\u6807\u9898\u548C\u300C\u8BB0\u5F55\u300D\u65F6\u4F1A\u5C3D\u91CF\u5199\u56DE\u9489\u9489\u6216\u98DE\u4E66\u3002\u817E\u8BAF\u4F1A\u8BAE\u548C\u5BFC\u5165\u573A\u6B21\u53EA\u6539\u672C\u673A\u3002\u5F85\u529E\u3001\u9010\u5B57\u7A3F\u3001\u672C\u673A\u603B\u7ED3\u4E0D\u4F1A\u5199\u56DE\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "filters", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: writeback.enabled ? "on" : "", disabled: writebackBusy, onClick: () => setWriteback(true), children: "\u6253\u5F00" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: !writeback.enabled ? "on" : "", disabled: writebackBusy, onClick: () => setWriteback(false), children: "\u5173\u95ED" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "block", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u540C\u6B65" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u5217\u8868\u300C\u66F4\u65B0\u300D\u53EA\u62C9\u672C\u673A\u8FD8\u6CA1\u6709\u7684\uFF0C\u6BCF\u4E2A\u6765\u6E90\u6700\u591A 300 \u573A\u3002\u5168\u91CF\u4F1A\u628A\u5C1A\u672A\u5165\u5E93\u7684\u90FD\u62C9\u5B8C\uFF0C\u672A\u767B\u5F55\u7684\u6765\u6E90\u4F1A\u8DF3\u8FC7\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "status", children: pulling ? syncProgressLabel(syncSt) || "\u540C\u6B65\u4E2D\u2026\u9875\u9762\u53EF\u7EE7\u7EED\u7528" : lastSyncLabel(syncSt) ? "\u4E0A\u6B21\uFF1A" + lastSyncLabel(syncSt) : "\u8FD8\u6CA1\u540C\u6B65\u8FC7" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "primary", disabled: pulling, onClick: () => setConfirmFull(true), children: pulling ? "\u540C\u6B65\u4E2D\u2026" : "\u5168\u91CF\u540C\u6B65" }),
        confirmFull ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          ConfirmSheet,
          {
            title: "\u5168\u91CF\u540C\u6B65\u542C\u8BB0",
            lede: "\u4ECE\u5DF2\u767B\u5F55\u7684\u9489\u9489\u3001\u98DE\u4E66\u3001\u817E\u8BAF\u628A\u672C\u673A\u8FD8\u6CA1\u6709\u7684\u542C\u8BB0\u90FD\u62C9\u4E0B\u6765\u3002\u5DF2\u5728\u672C\u673A\u7684\u4E0D\u8986\u76D6\u4F60\u6539\u8FC7\u7684\u8BB0\u5F55\u548C\u9010\u5B57\u7A3F\uFF1B\u672C\u673A\u5220\u8FC7\u7684\u4E0D\u4F1A\u518D\u56DE\u6765\u3002\u672A\u767B\u5F55\u7684\u6765\u6E90\u4F1A\u8DF3\u8FC7\u3002",
            confirmLabel: "\u5F00\u59CB\u5168\u91CF",
            busy: pulling,
            onConfirm: doFullSync,
            onClose: () => {
              if (!pulling) setConfirmFull(false);
            }
          }
        ) : null
      ] })
    ] });
    const verPane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u7248\u672C" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: appUp && appUp.channel === "zip" ? "\u5B89\u88C5\u5305\u4F1A\u5B9A\u671F\u5411 GitHub \u67E5\u6700\u65B0\u7248\uFF0C\u6709\u66F4\u65B0\u65F6\u9876\u680F\u51FA\u73B0\u300C\u6709\u66F4\u65B0\u300D\u3002\u70B9\u66F4\u65B0\u4F1A\u4E0B\u8F7D\u5B89\u88C5\u5305\u5E76\u91CD\u542F\u3002\u542C\u8BB0\u5728\u672C\u673A\uFF0C\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002\u82E5\u4ED3\u5E93\u662F\u79C1\u6709\u7684\u6216\u53EA\u53D1\u4E86\u9489\u76D8\uFF0C\u7528\u4E0B\u9762\u300C\u9009\u7528\u5B89\u88C5\u5305\u300D\u3002" : "\u5F00\u53D1\u8005\u53EF\u4ECE GitHub \u62C9\u6700\u65B0\u4EE3\u7801\u5E76\u91CD\u542F\u3002\u542C\u8BB0\u3001\u79F0\u547C\u548C\u5BC6\u94A5\u5728\u672C\u673A\uFF0C\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002\u6709\u672A\u63D0\u4EA4\u6539\u52A8\u65F6\u4E0D\u4F1A\u81EA\u52A8\u62C9\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5F53\u524D\u7248\u672C" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", readOnly: true, value: appUp && appUp.current || (verBusy ? "\u68C0\u67E5\u4E2D\u2026" : "\u2014") })
      ] }),
      !(appUp && appUp.channel === "zip") ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u5206\u652F" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", readOnly: true, value: appUp && appUp.branch || "\u2014" })
      ] }) : null,
      appUp && appUp.available && appUp.latest ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u8FDC\u7A0B\u7248\u672C" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", readOnly: true, value: appUp.latest })
      ] }) : null,
      appUp && appUp.subject ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u6700\u65B0\u8BF4\u660E" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "text", readOnly: true, value: appUp.subject })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "status", children: verErr ? verErr : verBusy ? "\u6B63\u5728\u68C0\u67E5\u2026" : (appUp && appUp.message || "\u8FD8\u6CA1\u68C0\u67E5\u8FC7") + (appUp && appUp.checkedAt ? " \xB7 " + fmtDateTime(appUp.checkedAt) : "") }),
      verErr ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "hint", children: "\u62C9\u5B8C\u4EE3\u7801\u540E\u5FC5\u987B\u91CD\u542F\u672C\u673A\u670D\u52A1\uFF0C\u53EA\u5237\u65B0\u7F51\u9875\u4E0D\u591F\u3002Mac\uFF1A\u4ED3\u5E93\u91CC\u6267\u884C bash scripts/restart.sh\u3002Windows\uFF1A\u53CC\u51FB scripts\\restart.bat\uFF08\u4E0D\u8981\u76F4\u63A5\u53CC\u51FB .ps1\uFF09\u3002" }) : null,
      appUp && appUp.dirty ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "hint", children: "\u672C\u673A\u4EE3\u7801\u6709\u672A\u63D0\u4EA4\u6539\u52A8\uFF0C\u5373\u4F7F\u6709\u65B0\u7248\u672C\u4E5F\u4E0D\u4F1A\u81EA\u52A8\u8986\u76D6\u3002" }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "primary", disabled: verBusy || props.updBusy, onClick: () => checkVersion(true), children: verBusy ? "\u68C0\u67E5\u4E2D\u2026" : "\u68C0\u67E5\u66F4\u65B0" }),
      appUp && appUp.available ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          className: "quiet",
          disabled: props.updBusy || !appUp.canApply,
          onClick: () => props.onRequestApply && props.onRequestApply(),
          children: props.updBusy ? "\u66F4\u65B0\u4E2D\u2026" : "\u66F4\u65B0"
        }
      ) : null,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "input",
        {
          ref: zipFileRef,
          type: "file",
          accept: ".zip,application/zip",
          hidden: true,
          onChange: (e3) => {
            const f = e3.target.files && e3.target.files[0];
            e3.target.value = "";
            if (f && props.onApplyZip) props.onApplyZip(f);
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          className: "quiet",
          disabled: props.updBusy,
          onClick: () => zipFileRef.current && zipFileRef.current.click(),
          children: props.updBusy ? "\u66F4\u65B0\u4E2D\u2026" : "\u9009\u7528\u5B89\u88C5\u5305"
        }
      )
    ] });
    const logsPane = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "page-inner log-pane", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u8FD0\u884C\u65E5\u5FD7" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "lede", children: "\u672C\u673A\u670D\u52A1\u3001\u542C\u8BB0\u66F4\u65B0\u548C MCP \u8C03\u7528\u90FD\u8BB0\u5728\u8FD9\u91CC\u3002\u6700\u65B0\u5728\u4E0A\u3002" }),
      logs.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "log-list", children: logs.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "log-row" + (x.level === "error" ? " err" : ""), children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "when", children: fmtDateTime(x.at) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "src", children: x.source }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "txt", children: x.text })
      ] }, x.at + "-" + i)) }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "empty", children: "\u8FD8\u6CA1\u6709\u65E5\u5FD7\u3002" })
    ] });
    const panes = { people: peoplePane, classify: classifyPane, llm: llmPane, kb: kbPane, ext: extPane, mcp: mcpPane, sync: syncPane, ver: verPane, logs: logsPane };
    const glossaryCount = people.length + projects.length + terms.length;
    const llmStatus = st.llm && st.llm.model || (st.llm && st.llm.keySet ? "\u5DF2\u914D" : "\u672A\u914D\u7F6E");
    const kbStatus = st.kb && st.kb.filled ? st.kb.filled + "/4" : "\u672A\u586B";
    const htStatus = st.ht && st.ht.keySet ? "\u5DF2\u914D" : "\u672A\u914D";
    const mcpStatus = mcp.enabled ? "\u5F00" : "\u5173";
    const classifyStatus = String((classify.rules || []).length || (classify.projectFromGlossary ? "\u8BCD\u8868" : "\u672A\u914D"));
    const syncStatusLabel = pulling ? "\u540C\u6B65\u4E2D" : lastSyncLabel(syncSt) ? "\u5DF2\u540C\u6B65" : "\u672A\u540C\u6B65";
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "settings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("aside", { className: "cats", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { children: "\u8BBE\u7F6E" }),
        [["people", "\u79F0\u547C", String(glossaryCount)], ["classify", "\u7C7B\u578B", classifyStatus], ["llm", "\u6A21\u578B", llmStatus], ["kb", "\u4E0A\u4F20", kbStatus], ["ext", "\u5916\u90E8\u7CFB\u7EDF", htStatus], ["mcp", "MCP", mcpStatus], ["sync", "\u542C\u8BB0", syncStatusLabel], ["ver", "\u7248\u672C", appUp && appUp.available ? "\u6709\u66F4\u65B0" : appUp && appUp.current || "\u2014"], ["logs", "\u65E5\u5FD7", String(logs.length || "")]].map(([id, label, n]) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "cat" + (tab === id ? " on" : ""), onClick: () => {
          setTab(id);
          setTestMsg("");
          setHtMsg("");
        }, children: [
          label + " ",
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "n", children: n })
        ] }, id))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "page", children: panes[tab] })
    ] });
  }

  // src/client/App.jsx
  var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
  function App() {
    const STORE = "ma-state";
    const [page, setPage] = (0, import_react6.useState)("meet");
    const [selectedMeet, setSelectedMeet] = (0, import_react6.useState)(null);
    const [selectedTodo, setSelectedTodo] = (0, import_react6.useState)(0);
    const [toast, setToast] = (0, import_react6.useState)("");
    const [appUp, setAppUp] = (0, import_react6.useState)(null);
    const [updOpen, setUpdOpen] = (0, import_react6.useState)(false);
    const [updBusy, setUpdBusy] = (0, import_react6.useState)(false);
    (0, import_react6.useEffect)(() => {
      try {
        const saved = sessionStorage.getItem(STORE);
        const meet = new URLSearchParams(window.location.search).get("meet");
        if (saved) {
          const s = JSON.parse(saved);
          if (s.page) setPage(s.page);
          if (s.selectedMeet) setSelectedMeet(s.selectedMeet);
          if (s.selectedTodo) setSelectedTodo(s.selectedTodo);
        }
        if (meet) {
          setSelectedMeet(meet);
          setPage("meet");
        }
      } catch {
      }
    }, []);
    (0, import_react6.useEffect)(() => {
      try {
        sessionStorage.setItem(STORE, JSON.stringify({ page, selectedMeet, selectedTodo }));
      } catch {
      }
    }, [page, selectedMeet, selectedTodo]);
    const checkAppUp = import_react6.default.useCallback((fresh) => {
      return api("/api/app/update" + (fresh ? "?fresh=1" : ""), void 0, "GET", { timeoutMs: 3e4 }).then((r) => {
        setAppUp(r);
        return r;
      });
    }, []);
    (0, import_react6.useEffect)(() => {
      const load = (fresh) => {
        checkAppUp(fresh).catch(() => {
        });
      };
      load(false);
      const t = setInterval(() => load(true), 30 * 60 * 1e3);
      const onVis = () => {
        if (document.visibilityState === "visible") load(false);
      };
      document.addEventListener("visibilitychange", onVis);
      return () => {
        clearInterval(t);
        document.removeEventListener("visibilitychange", onVis);
      };
    }, [checkAppUp]);
    const showToast = import_react6.default.useCallback((t) => {
      setToast(t);
      setTimeout(() => setToast(""), String(t || "").length > 12 ? 3200 : 1600);
    }, []);
    const waitRestart = () => {
      const ping = (n) => {
        fetch("/api/health", { signal: AbortSignal.timeout(1500) }).then((res) => {
          if (res.ok) {
            window.location.reload();
            return;
          }
          throw new Error("not ready");
        }).catch(() => {
          if (n > 45) {
            setUpdBusy(false);
            showToast("\u670D\u52A1\u8FD8\u5728\u91CD\u542F\uFF0C\u8BF7\u7A0D\u540E\u518D\u5237\u65B0");
            return;
          }
          setTimeout(() => ping(n + 1), 1e3);
        });
      };
      setTimeout(() => ping(0), 2500);
    };
    const doAppUpdate = () => {
      if (updBusy) return;
      if (appUp && appUp.canApply === false) {
        showToast(appUp.message || "\u73B0\u5728\u4E0D\u80FD\u81EA\u52A8\u66F4\u65B0");
        setUpdOpen(false);
        return;
      }
      setUpdBusy(true);
      api("/api/app/update", {}, "POST", { timeoutMs: 5 * 60 * 1e3 }).then((r) => {
        if (!r.updated) {
          setUpdBusy(false);
          setUpdOpen(false);
          setAppUp(r);
          showToast(r.message || "\u5DF2\u662F\u6700\u65B0");
          return;
        }
        showToast(r.message || "\u6B63\u5728\u91CD\u542F\u2026");
        waitRestart();
      }).catch((er) => {
        setUpdBusy(false);
        showToast(String(er && er.message || er));
      });
    };
    const applyZipFile = (file) => {
      if (updBusy || !file) return;
      setUpdBusy(true);
      uploadAppZip(file).then((r) => {
        showToast(r && r.message || "\u6B63\u5728\u91CD\u542F\u2026");
        waitRestart();
      }).catch((er) => {
        setUpdBusy(false);
        showToast(String(er && er.message || er));
      });
    };
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "app", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("header", { className: "top", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "brand", children: [
          "\u4F1A\u8BAE\u52A9\u624B",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("small", { children: "LOCAL" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("nav", { className: "main", children: NAV.map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: page === id ? "on" : "", onClick: () => setPage(id), children: label }, id)) }),
        appUp && appUp.available ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "top-actions", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sync-pill on", disabled: updBusy, onClick: () => setUpdOpen(true), children: updBusy ? "\u66F4\u65B0\u4E2D\u2026" : "\u6709\u66F4\u65B0" }) }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("main", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "view" + (page === "meet" ? "" : " view-off"), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          MeetPage,
          {
            active: page === "meet",
            selected: selectedMeet,
            setSelected: setSelectedMeet,
            toast: showToast,
            goLedger: (id) => {
              setSelectedTodo(id);
              setPage("ledger");
            }
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "view" + (page === "ledger" ? "" : " view-off"), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          LedgerPage,
          {
            active: page === "ledger",
            selected: selectedTodo,
            setSelected: setSelectedTodo,
            toast: showToast,
            goMeet: (id) => {
              setSelectedMeet(id);
              setPage("meet");
            }
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "view" + (page === "settings" ? "" : " view-off"), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          SettingsPage,
          {
            toast: showToast,
            appUp,
            updBusy,
            onCheckUpdate: checkAppUp,
            onRequestApply: () => setUpdOpen(true),
            onApplyZip: applyZipFile
          }
        ) })
      ] }),
      toast ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "toast", children: toast }) : null,
      updOpen ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        ConfirmSheet,
        {
          title: "\u66F4\u65B0\u4F1A\u8BAE\u52A9\u624B",
          lede: updBusy ? appUp && appUp.channel === "zip" ? "\u6B63\u5728\u4E0B\u8F7D\u5B89\u88C5\u5305\u5E76\u91CD\u542F\u672C\u673A\u670D\u52A1\u3002\u542C\u8BB0\u6570\u636E\u5728\u672C\u673A\uFF0C\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002\u8BF7\u7B49\u9875\u9762\u81EA\u52A8\u5237\u65B0\uFF0C\u5148\u4E0D\u8981\u5173\u6389\u3002" : "\u6B63\u5728\u62C9\u4EE3\u7801\u5E76\u91CD\u542F\u672C\u673A\u670D\u52A1\u3002\u542C\u8BB0\u6570\u636E\u5728\u672C\u673A\uFF0C\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002\u8BF7\u7B49\u9875\u9762\u81EA\u52A8\u5237\u65B0\uFF0C\u5148\u4E0D\u8981\u5173\u6389\u3002" : (appUp && appUp.subject ? "\u6700\u65B0\uFF1A" + appUp.subject + "\u3002" : "") + (appUp && appUp.canApply ? appUp.channel === "zip" ? "\u4F1A\u4E0B\u8F7D\u6700\u65B0\u5B89\u88C5\u5305\u5E76\u91CD\u542F\u3002\u542C\u8BB0\u3001\u79F0\u547C\u548C\u5BC6\u94A5\u90FD\u5728\u672C\u673A\uFF0C\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002" : "\u4F1A\u4ECE GitHub \u62C9\u6700\u65B0\u4EE3\u7801\u5E76\u91CD\u542F\u3002\u542C\u8BB0\u3001\u79F0\u547C\u548C\u5BC6\u94A5\u90FD\u5728\u672C\u673A\uFF0C\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002" : appUp && appUp.message || "\u73B0\u5728\u4E0D\u80FD\u81EA\u52A8\u66F4\u65B0"),
          confirmLabel: "\u66F4\u65B0",
          busyLabel: "\u66F4\u65B0\u4E2D\u2026",
          busy: updBusy,
          onConfirm: doAppUpdate,
          onClose: () => {
            if (!updBusy) setUpdOpen(false);
          }
        }
      ) : null
    ] });
  }

  // src/web/main.js
  var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
  var el = document.getElementById("root");
  (0, import_client.createRoot)(el).render(/* @__PURE__ */ (0, import_jsx_runtime6.jsx)(App, {}));
})();
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (**
   * @license React
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (**
   * @license React
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
