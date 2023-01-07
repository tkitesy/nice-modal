import {
  Component,
  ConcreteComponent,
  defineComponent,
  InjectionKey,
  DefineComponent,
  inject,
  shallowRef,
  provide,
  ShallowRef,
} from "vue";

export type VueProps<T> = T extends ConcreteComponent<infer TProps>
  ? TProps
  : T extends Component<infer Props>
  ? Props
  : any;

const defaultCallback = (args: unknown) => {};

type NiceModalContext = {
  visibleRef: ShallowRef<boolean>;
  show(): Promise<unknown>;
  hide(): void;
  remove(): void;
  resolve(args: unknown): void;
  reject(args: unknown): void;
};

export function create<C extends Component, Props extends {} = VueProps<C>>(
  Comp: C
) {
  const argsRef = shallowRef({});
  const removedRef = shallowRef(true);
  const visibleRef = shallowRef(false);
  let promise: Promise<unknown> | null = null;
  let resolveCallback = defaultCallback;
  let rejectCallback = defaultCallback;

  function show(args?: Props) {
    visibleRef.value = true;
    removedRef.value = false;
    if (args) {
      argsRef.value = args;
    }
    if (!promise) {
      promise = new Promise<unknown>((_resolve, _reject) => {
        resolveCallback = _resolve;
        rejectCallback = _reject;
      });
    }
    return promise;
  }
  function hide() {
    argsRef.value = {};
    promise = null;
    visibleRef.value = false;
  }
  function resolve(args: unknown) {
    resolveCallback(args);
  }
  function reject(args: unknown) {
    rejectCallback(args);
  }
  function remove() {
    hide();
    removedRef.value = true;
  }

  const Placeholder = defineComponent(function () {
    provide(NiceModalContext, {
      visibleRef,
      show,
      hide,
      remove,
      resolve,
      reject,
    });
    return function render() {
      const args = argsRef.value;
      const removed = removedRef.value;
      return !removed && <Comp {...args} />;
    };
  });

  const service = {
    show,
    hide,
    remove,
  };

  Placeholder.service = service;

  return Placeholder as DefineComponent<Partial<Props>> & {
    service: typeof service;
  };
}

const NiceModalContext: InjectionKey<NiceModalContext> =
  Symbol("NiceModalContext");

export function useModal() {
  const modal = inject(NiceModalContext);

  if (!modal) {
    throw new Error("useModal must use as child of NiceModal Context");
  }

  return modal;
}

export function elDialog(modal: NiceModalContext) {
  return {
    modelValue: modal.visibleRef.value,
    onClose: modal.hide,
    onClosed: modal.remove,
  };
}

export default {
  useModal,
  create,
  elDialog,
};
