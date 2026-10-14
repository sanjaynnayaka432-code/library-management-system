import React, { useState, useEffect } from 'react';
import { QrCode, Download, Printer, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { booksApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const QrModal = ({ isOpen, onClose, book }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && book?.id) {
      if (book.qrCodeUrl) {
        setQrCodeUrl(book.qrCodeUrl);
      } else {
        fetchQr();
      }
    }
  }, [isOpen, book]);

  const fetchQr = async () => {
    try {
      setLoading(true);
      const res = await booksApi.getQrCode(book.id);
      if (res.data?.success) {
        setQrCodeUrl(res.data.qrCodeUrl || res.data.qrDataUrl);
      }
    } catch {
      toast.error('Failed to generate QR Code');
    } finally {
      setLoading(false);
    }
  };

  const bookUrl = `${window.location.origin}/books/${book?.id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(bookUrl);
    setCopied(true);
    toast.success('Book link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>LibXVerse Tag - ${book?.title}</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; }
            .tag { border: 2px solid #0f172a; padding: 24px; text-align: center; border-radius: 16px; width: 280px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            img { width: 180px; height: 180px; margin-bottom: 12px; }
            h2 { margin: 0 0 6px; font-size: 15px; font-weight: bold; color: #0f172a; }
            p { margin: 2px 0; font-size: 12px; color: #475569; }
            .shelf { font-weight: bold; background: #f1f5f9; padding: 6px 12px; border-radius: 8px; display: inline-block; margin-top: 10px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="tag">
            <img src="${qrCodeUrl}" alt="QR Code" />
            <h2>${book?.title}</h2>
            <p><strong>ISBN:</strong> ${book?.isbn}</p>
            <p><strong>Author:</strong> ${book?.author}</p>
            <div class="shelf">Shelf: ${book?.shelf_location || 'General Stacks'}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `libxverse-qr-${book?.isbn || book?.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR Code image downloaded');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Book QR Tag"
      subtitle="Scan with any camera or handheld barcode reader to open real-time circulation state"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center">
        {/* Holographic QR Display Card */}
        <div className="relative p-5 rounded-3xl bg-white border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-indigo-500/10 mb-4 flex items-center justify-center min-h-[220px] min-w-[220px]">
          {loading ? (
            <div className="text-slate-400 text-xs animate-pulse">Synthesizing QR code...</div>
          ) : qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR Code for ${book?.title}`}
              className="w-48 h-48 object-contain rounded-xl"
            />
          ) : (
            <QrCode className="w-24 h-24 text-slate-300" />
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white line-clamp-1">
            {book?.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ISBN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{book?.isbn}</span>
          </p>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 text-xs font-semibold backdrop-blur-md">
            Location: <span className="font-bold">{book?.shelf_location || 'General Stacks'}</span>
          </div>
        </div>

        {/* Link Copy Capsule */}
        <div className="w-full flex items-center gap-2 p-2.5 px-3.5 glass-panel rounded-2xl text-xs mb-5">
          <span className="truncate text-slate-500 font-mono flex-1 text-left">
            {bookUrl}
          </span>
          <button
            onClick={copyUrl}
            className="p-1 text-slate-500 hover:text-brand-500 transition-colors"
            title="Copy link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleDownload}
            className="flex-1"
          >
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
            className="flex-1"
          >
            Print Tag
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ExternalLink}
            onClick={() => {
              onClose();
              window.open(`/books/${book?.id}`, '_self');
            }}
            className="flex-1"
          >
            Open Page
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QrModal;
