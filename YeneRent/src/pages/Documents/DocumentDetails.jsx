import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../../utils/api'; // Assuming 'get' is exported from api.js
import { formatDate, formatFileSize } from '../../utils/utils';
import './DocumentDetails.css'; // Import the specific CSS for this component

const DocumentDetails = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const [currentDocument, setCurrentDocument] = useState(null);
    const [properties, setProperties] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const DOC_KEY = 'documents';
    const PROPERTY_KEY = 'properties';
    const TENANT_KEY = 'tenants';

    useEffect(() => {
        const fetchDocumentDetails = async () => {
            if (!documentId) {
                alert('Document ID not found in URL.'); // Placeholder for notification
                navigate('/documents');
                return;
            }

            try {
                const [fetchedProperties, fetchedTenants, documents] = await Promise.all([
                    get(PROPERTY_KEY),
                    get(TENANT_KEY),
                    get(DOC_KEY)
                ]);

                setProperties(fetchedProperties);
                setTenants(fetchedTenants);

                const foundDocument = documents.find(doc => doc.id === documentId);

                if (!foundDocument) {
                    alert('Document not found.'); // Placeholder for notification
                    navigate('/documents');
                    return;
                }
                setCurrentDocument(foundDocument);
            } catch (err) {
                console.error('Failed to fetch document details:', err);
                setError('Failed to load document details.');
                alert('Failed to load document details.'); // Placeholder for notification
            } finally {
                setLoading(false);
            }
        };

        fetchDocumentDetails();
    }, [documentId, navigate]);

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return { icon: 'fa-solid fa-file-image', class: 'icon-image' };
        if (fileType === 'application/pdf') return { icon: 'fa-solid fa-file-pdf', class: 'icon-pdf' };
        if (fileType && fileType.includes('wordprocessingml')) return { icon: 'fa-solid fa-file-word', class: 'icon-doc' };
        return { icon: 'fa-solid fa-file', class: 'icon-other' };
    };

    const handleBack = () => {
        navigate('/documents'); // Assuming /documents is the list page
    };

    const handleEdit = () => {
        navigate(`/documents?editId=${currentDocument.id}`); // Redirect to documents list with editId
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${currentDocument.name}"?`)) { // Placeholder for confirmation
            try {
                await get(DOC_KEY, currentDocument.id, 'DELETE'); // Assuming 'get' can handle DELETE with a third arg
                alert('Document deleted successfully!'); // Placeholder for notification
                navigate('/documents');
            } catch (err) {
                console.error('Failed to delete document:', err);
                alert('Failed to delete document.'); // Placeholder for notification
            }
        }
    };

    const handleShare = async () => {
        if (!currentDocument || !currentDocument.url) {
            alert('No document to share.');
            return;
        }

        const shareData = {
            title: currentDocument.name,
            text: `Check out this document: ${currentDocument.name}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log('Document shared successfully');
            } catch (err) {
                console.error('Share failed:', err.message);
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            } catch (err) {
                alert('Could not copy link.');
                console.error('Failed to copy: ', err);
            }
        }
    };

    const handlePrint = () => {
        if (!currentDocument || !currentDocument.url) {
            alert('No document file to print.');
            return;
        }

        // For PDFs, print the content of the iframe directly for a clean print.
        const iframe = document.querySelector('.document-preview-content iframe');
        if (iframe && currentDocument.type === 'application/pdf') {
            try {
                iframe.contentWindow.print();
            } catch (error) {
                console.error('Could not access iframe content for printing. Falling back to window.print().', error);
                window.print(); // Fallback for cross-origin issues
            }
            return;
        }

        // For images, use the @media print styles for a clean image print
        if (currentDocument.type && currentDocument.type.startsWith('image/')) {
            window.print();
            return;
        }

        alert('Printing is not supported for this file type. Please download the file to print it.');
    };

    if (loading) {
        return <div className="loading">Loading document details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!currentDocument) {
        return <div className="no-document">Document not found.</div>;
    }

    let linkedToText = 'General';
    if (currentDocument.propertyId) {
        const property = properties.find(p => p.id === currentDocument.propertyId);
        linkedToText = property ? `Property: ${property.name}` : 'N/A Property';
    } else if (currentDocument.tenantId) {
        const tenant = tenants.find(t => t.id === currentDocument.tenantId);
        linkedToText = tenant ? `Tenant: ${tenant.name}` : 'N/A Tenant';
    }

    const renderDocumentPreviewContent = () => {
        if (!currentDocument.url) {
            return (
                <div className="placeholder-message">
                    <i className="fa-solid fa-file-circle-xmark"></i>
                    <p>No file available for preview.</p>
                </div>
            );
        }

        if (currentDocument.type && currentDocument.type.startsWith('image/')) {
            return <img src={currentDocument.url} alt={currentDocument.name} />;
        } else if (currentDocument.type === 'application/pdf') {
            return <iframe src={currentDocument.url} title={currentDocument.name}></iframe>;
        } else {
            const { icon, class: iconClass } = getFileIcon(currentDocument.type);
            return (
                <div className="placeholder-message">
                    <i className={`${icon} ${iconClass}`}></i>
                    <p>Preview not available for this file type.</p>
                    <p>Click "Download File" to view.</p>
                </div>
            );
        }
    };

    return (
        <main id="main-content" className="main-content">
            <div id="document-details-view">
                <div className="page-header">
                    <div>
                        <button onClick={handleBack} className="btn-secondary">
                            <i className="fa-solid fa-arrow-left"></i> Back to Documents
                        </button>
                        <h1 id="document-title">{currentDocument.name}</h1>
                        <p id="document-subtitle">Category: {currentDocument.category}</p>
                    </div>
                    <div className="page-actions">
                        <button onClick={handlePrint} className="btn-secondary">
                            <i className="fa-solid fa-print"></i> Print
                        </button>
                        <button onClick={handleEdit} className="btn-primary">
                            <i className="fa-solid fa-pencil"></i> Edit Document
                        </button>
                        <button onClick={handleDelete} className="btn-danger">
                            <i className="fa-solid fa-trash-can"></i> Delete Document
                        </button>
                    </div>
                </div>

                <div className="data-card">
                    <div className="document-details-grid">
                        <div className="detail-section">
                            <h4>Document Information</h4>
                            <div className="detail-item"><span>Name</span><span id="detail-name">{currentDocument.name}</span></div>
                            <div className="detail-item"><span>Category</span><span id="detail-category">{currentDocument.category}</span></div>
                            <div className="detail-item"><span>Linked To</span><span id="detail-linked-to">{linkedToText}</span></div>
                            <div className="detail-item"><span>Size</span><span id="detail-size">{formatFileSize(currentDocument.size)}</span></div>
                            <div className="detail-item"><span>Upload Date</span><span id="detail-upload-date">{formatDate(currentDocument.uploadDate)}</span></div>
                        </div>
                        <div className="detail-section document-preview-section">
                            <h4>Document Preview</h4>
                            <div id="document-preview-content" className="document-preview-content">
                                {renderDocumentPreviewContent()}
                            </div>
                            <div className="preview-actions">
                                {currentDocument.url && (
                                    <>
                                        <a
                                            id="download-document-btn"
                                            href={currentDocument.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={currentDocument.name}
                                            className="btn-secondary"
                                        >
                                            <i className="fa-solid fa-download"></i> Download File
                                        </a>
                                        <button onClick={handleShare} id="share-document-btn" className="btn-secondary">
                                            <i className="fa-solid fa-share-alt"></i> Share
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default DocumentDetails;
