import { ref, reactive, provide, inject } from 'vue';

const LOADING_KEY = Symbol('loading');

export const createLoadingState = () => {
  const loading = ref(false);
  const loadingText = ref('加载中...');
  const loadingType = ref('spinner');
  const fullscreen = ref(false);

  const showLoading = (options = {}) => {
    loading.value = true;
    if (options.text) loadingText.value = options.text;
    if (options.type) loadingType.value = options.type;
    if (options.fullscreen) fullscreen.value = true;
  };

  const hideLoading = () => {
    loading.value = false;
    fullscreen.value = false;
  };

  const withLoading = async (fn, options = {}) => {
    showLoading(options);
    try {
      const result = await fn();
      return result;
    } finally {
      hideLoading();
    }
  };

  return {
    loading,
    loadingText,
    loadingType,
    fullscreen,
    showLoading,
    hideLoading,
    withLoading
  };
};

export const provideLoading = () => {
  const loadingState = createLoadingState();
  provide(LOADING_KEY, loadingState);
  return loadingState;
};

export const useLoading = () => {
  const loadingState = inject(LOADING_KEY, null);
  if (!loadingState) {
    return createLoadingState();
  }
  return loadingState;
};

export default {
  createLoadingState,
  provideLoading,
  useLoading
};
