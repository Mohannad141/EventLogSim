import { cn } from '../../utils/cn.js';

const PageContainer = ({ className, children }) => {
  return (
    <main className={cn('w-full px-6 py-8 lg:px-8', className)}>
      {children}
    </main>
  );
};

export default PageContainer;
