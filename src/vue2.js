const defaultCallback = () => {};

const NiceModalContext = Symbol("NiceModalContext");

export function create(Comp) {
  let promise = null;
  let resolveCallback = defaultCallback;
  let rejectCallback = defaultCallback;

  let _target = null;

  function show(args) {
    _target.visible = true;
    _target.removed = false;
    if (args) {
      _target.args = args;
    }
    if (!promise) {
      promise = new Promis((_resolve, _reject) => {
        resolveCallback = _resolve;
        rejectCallback = _reject;
      });
    }
    return promise;
  }
  function hide() {
    _target.args = {};
    promise = null;
    _target.visible = false;
  }
  function resolve(args) {
    resolveCallback(args);
  }
  function reject(args) {
    rejectCallback(args);
  }
  function remove() {
    hide();
    _target.removed = true;
  }

  const service = {
    show,
    hide,
    remove,
  };

  const Placeholder = {
    data() {
      return {
        args: {},
        removed: true,
        visible: false,
      };
    },
    provide: {
      [NiceModalContext]() {
        return {
          visible: () => this.visible,
          show,
          hide,
          remove,
          resolve,
          reject,
        };
      },
    },
    created() {
      _target = this;
    },
    render(h) {
      if (this.removed) {
        return null;
      }
      return h(Comp, { props: this.args });
    },
  };

  Placeholder.service = service;

  return Placeholder;
}

export function mixinModal(propName) {
  return {
    inject: {
      [propName]: NiceModalContext,
    },
  };
}
