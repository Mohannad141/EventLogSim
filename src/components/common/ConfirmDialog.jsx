import Modal from './Modal.jsx';
import Button from '../primitives/Button.jsx';

const ConfirmDialog = ({
  open,
  onClose,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-700">{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;
