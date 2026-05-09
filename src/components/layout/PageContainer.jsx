import { cn } from '../../utils/cn.js';

const PageContainer = ({ className, children }) => {
  return (
    <main className={cn('mx-auto max-w-7xl px-6 py-8', className)}>
      {children}
    </main>
  );
};

export default PageContainer;
