import React, { useEffect } from 'react';
import './Modal.css'; // Assuming you'll create a corresponding CSS file

const Modal = ({ title, children, isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    } else {
      document.body.style.overflow = 'unset'; // Re-enable scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; // Ensure scrolling is re-enabled on unmount
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i> {/* Using Font Awesome for the close icon */}
          </button>
        </div>
        <div id="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
