import { cn } from '../../utils/cn.js';

const Card = ({ as: Tag = 'div', className, children, ...rest }) => {
  return (
    <Tag
      className={cn(
        'rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Card;
