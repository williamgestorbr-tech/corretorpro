
import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
type ExportFormat = 'jpeg' | 'zip' | 'pdf';

interface ImageItem {
  id: string;
  data: string;
  name: string;
}

const EXPORT_WIDTH = 3840;
const EXPORT_HEIGHT = 2160;

const ImageWatermark: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [logoSize, setLogoSize] = useState(15);
  const [opacity, setOpacity] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('jpeg');
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleBaseFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filesArray = Array.from(files);
      filesArray.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substr(2, 9),
              data: event.target?.result as string,
              name: file.name
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (images.length > 0) {
      renderToCanvas(previewCanvasRef.current, images[currentIndex].data, false).catch(console.error);
    }
  }, [images, currentIndex, logoImage, position, logoSize, opacity]);

  const renderToCanvas = async (canvas: HTMLCanvasElement | null, imageData: string, isHighRes: boolean): Promise<void> => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (isHighRes) {
          canvas.width = EXPORT_WIDTH;
          canvas.height = EXPORT_HEIGHT;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (isHighRes) {
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width / 2) - (img.width / 2) * scale;
          const y = (canvas.height / 2) - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        } else {
          ctx.drawImage(img, 0, 0);
        }

        if (logoImage) {
          const logo = new Image();
          logo.onload = () => {
            const logoAspectRatio = logo.width / logo.height;
            const targetWidth = (canvas.width * logoSize) / 100;
            const targetHeight = targetWidth / logoAspectRatio;

            let lx = 0;
            let ly = 0;
            const margin = canvas.width * 0.03;

            switch (position) {
              case 'top-left': lx = margin; ly = margin; break;
              case 'top-right': lx = canvas.width - targetWidth - margin; ly = margin; break;
              case 'bottom-left': lx = margin; ly = canvas.height - targetHeight - margin; break;
              case 'bottom-right': lx = canvas.width - targetWidth - margin; ly = canvas.height - targetHeight - margin; break;
              case 'center': lx = (canvas.width - targetWidth) / 2; ly = (canvas.height - targetHeight) / 2; break;
            }

            ctx.globalAlpha = opacity / 100;
            ctx.drawImage(logo, lx, ly, targetWidth, targetHeight);
            ctx.globalAlpha = 1.0;
            resolve();
          };
          logo.onerror = () => {
            console.error("Failed to load logo image");
            resolve();
          };
          logo.src = logoImage;
        } else {
          resolve();
        }
      };
      img.onerror = () => reject(new Error("Failed to load base image"));
      img.src = imageData;
    });
  };

  const triggerDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSingle = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const exportCanvas = document.createElement('canvas');
      await renderToCanvas(exportCanvas, images[currentIndex].data, true);
      const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
      const uniqueId = Math.floor(Math.random() * 9000000) + 1000000;
      triggerDownload(dataUrl, `Corretor pro - ${uniqueId}.jpg`);
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar imagem.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportBatch = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    const uniqueBatchId = Math.floor(Math.random() * 9000000) + 1000000;

    try {
      const exportCanvas = document.createElement('canvas');

      if (exportFormat === 'jpeg') {
        for (let i = 0; i < images.length; i++) {
          await renderToCanvas(exportCanvas, images[i].data, true);
          const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
          triggerDownload(dataUrl, `Corretor pro - ${uniqueBatchId}-${i + 1}.jpg`);
          await new Promise(r => setTimeout(r, 800));
        }
      } else if (exportFormat === 'zip') {
        const zip = new JSZip();
        for (let i = 0; i < images.length; i++) {
          await renderToCanvas(exportCanvas, images[i].data, true);
          const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.90);
          const base64Data = dataUrl.split(',')[1];
          zip.file(`imagem-${i + 1}.jpg`, base64Data, { base64: true });
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        triggerDownload(url, `Corretor-Pro-Lote-${uniqueBatchId}.zip`);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'pdf') {
        // Landscape orientation for 16:9 images
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [EXPORT_WIDTH, EXPORT_HEIGHT]
        });

        for (let i = 0; i < images.length; i++) {
          await renderToCanvas(exportCanvas, images[i].data, true);
          const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.85);
          if (i > 0) pdf.addPage([EXPORT_WIDTH, EXPORT_HEIGHT], 'landscape');
          pdf.addImage(dataUrl, 'JPEG', 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
        }
        pdf.save(`Corretor-Pro-Lote-${uniqueBatchId}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar o lote.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (id: string) => {
    const filtered = images.filter(img => img.id !== id);
    setImages(filtered);
    if (currentIndex >= filtered.length && filtered.length > 0) {
      setCurrentIndex(filtered.length - 1);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-blue-50 border border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
            <i className="fa-solid fa-camera-retro text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Exportação Profissional 4K</h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">Formato Ultra HD (3840x2160)</p>
          </div>
        </div>

        {images.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {(['jpeg', 'zip', 'pdf'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${exportFormat === fmt ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <button
              onClick={handleExportBatch}
              disabled={isProcessing}
              className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 shadow-xl transition-all disabled:opacity-50 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  Processando...
                </>
              ) : (
                <>
                  <i className={`fa-solid ${exportFormat === 'pdf' ? 'fa-file-pdf' : exportFormat === 'zip' ? 'fa-file-zipper' : 'fa-layer-group'}`}></i>
                  Exportar {exportFormat.toUpperCase()} ({images.length})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-4 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-5 transition-all hover:border-blue-400 bg-slate-50/50">
              <label className="block cursor-pointer">
                <span className="text-xs font-black text-slate-500 uppercase block mb-2">Importar Fotos</span>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-images text-2xl text-blue-400"></i>
                  <span className="text-sm font-bold text-slate-700">
                    {images.length > 0 ? `Selecionadas (${images.length})` : 'Clique para selecionar'}
                  </span>
                </div>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleBaseFilesUpload} />
              </label>
            </div>

            <div className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-5 transition-all hover:border-amber-400 bg-slate-50/50">
              <label className="block cursor-pointer">
                <span className="text-xs font-black text-slate-500 uppercase block mb-2">Logo do Corretor</span>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-signature text-2xl text-amber-400"></i>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Selecionar PNG</span>
                    {logoImage && <span className="text-[10px] font-black text-green-600 uppercase flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Logo Adicionada</span>}
                  </div>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          {images.length > 0 && (
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">Posicionamento da Logo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] as Position[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosition(pos)}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${position === pos ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                    <span className="text-slate-400">Escala da Logo</span>
                    <span className="text-blue-600 font-bold">{logoSize}%</span>
                  </div>
                  <input type="range" min="5" max="50" value={logoSize} onChange={(e) => setLogoSize(parseInt(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                    <span className="text-slate-400">Opacidade</span>
                    <span className="text-blue-600 font-bold">{opacity}%</span>
                  </div>
                  <input type="range" min="10" max="100" value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))} className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-8 space-y-4">
          <div className="relative group">
            <div className="aspect-video bg-slate-900 rounded-[32px] overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-2xl">
              {images.length === 0 ? (
                <div className="text-center p-8 md:p-12 flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700/50 shadow-inner">
                    <i className="fa-solid fa-cloud-arrow-up text-2xl md:text-3xl text-slate-600"></i>
                  </div>
                  <h3 className="text-white font-black text-base md:text-xl tracking-tight mb-2">Área de Visualização</h3>
                  <p className="text-slate-500 text-xs md:text-sm max-w-[200px] md:max-w-xs mx-auto font-medium leading-relaxed">Adicione as fotos do imóvel para ver o resultado 4K aqui.</p>
                </div>
              ) : (
                <>
                  <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain" />

                  <div className="absolute top-4 right-4">
                    <button
                      onClick={handleExportSingle}
                      disabled={isProcessing}
                      className="bg-white hover:bg-slate-50 text-slate-900 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <i className="fa-solid fa-circle-notch animate-spin text-blue-600"></i>
                      ) : (
                        <i className="fa-solid fa-download text-blue-600"></i>
                      )}
                      Exportar Atual 4K
                    </button>
                  </div>

                  {images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"><i className="fa-solid fa-chevron-left"></i></button>
                      <button onClick={() => setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"><i className="fa-solid fa-chevron-right"></i></button>
                    </>
                  )}
                </>
              )}
            </div>
            {images.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-2 italic text-center font-medium">As imagens serão exportadas na proporção 16:9 (3840x2160) com preenchimento para garantir o formato 4K.</p>
            )}
          </div>

          {images.length > 0 && (
            <div className="bg-slate-50 p-4 md:p-6 rounded-3xl border border-slate-100 transition-all">
              <div className="flex items-center justify-between mb-4 px-1 md:px-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Galeria de Lote</span>
                  <span className="text-xs font-bold text-blue-600">{images.length} fotos carregadas</span>
                </div>
                <button
                  onClick={() => { if (confirm('Remover todas as fotos?')) setImages([]); }}
                  className="bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  Limpar Lote
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-6 px-1 md:px-2 custom-scrollbar snap-x snap-mandatory">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`relative flex-shrink-0 w-32 md:w-28 aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all snap-start ${currentIndex === idx ? 'border-blue-500 scale-105 shadow-xl ring-4 ring-blue-500/20' : 'border-white opacity-70 hover:opacity-100 hover:border-slate-200'}`}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    <img src={img.data} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="absolute top-1.5 right-1.5 w-8 h-8 bg-black/60 hover:bg-red-500 backdrop-blur-md rounded-xl text-white text-xs flex items-center justify-center shadow-lg transition-all transform hover:scale-110"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                    {currentIndex === idx && (
                      <div className="absolute inset-0 bg-blue-600/10 pointer-events-none flex items-center justify-center">
                        <i className="fa-solid fa-eye text-white text-xl drop-shadow-md"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageWatermark;
