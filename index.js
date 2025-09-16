import { useCallback, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function Home() {
  const [dragActive, setDragActive] = useState(false);
  const [filesList, setFilesList] = useState([]);
  const [mergedUrl, setMergedUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const onFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter(f => f.type === 'application/pdf');
    setFilesList(prev => [...prev, ...files]);
    setMergedUrl(null);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const removeFile = (idx) => {
    setFilesList(filesList.filter((_, i) => i !== idx));
  };

  const mergePDFs = async () => {
    if (filesList.length === 0) return alert('Please add PDF files to merge.');
    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of filesList) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copied = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copied.forEach(p => mergedPdf.addPage(p));
      }
      const bytes = await mergedPdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setMergedUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      alert('Error while merging PDFs. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => { setFilesList([]); setMergedUrl(null); };

  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='w-full max-w-3xl'>
        <div className='bg-white rounded-2xl shadow-xl p-8'>
          <h1 className='text-2xl font-bold text-gray-800 mb-2'>PDF Merge Tool</h1>
          <p className='text-gray-600 mb-6'>Drag & drop PDFs or click to select. Merging happens in your browser.</p>

          <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}>
            <label className={'block cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition ' + (dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white')}>
              <input type='file' multiple accept='application/pdf' onChange={(e)=>onFiles(e.target.files)} className='hidden' />
              <div className='flex flex-col items-center'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-12 w-12 mb-3 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-4-4V7a4 4 0 014-4h6l5 5v4a4 4 0 01-4 4H7z' /></svg>
                <div className='text-gray-700 font-medium'>Drop PDFs here or click to browse</div>
                <div className='text-sm text-gray-500 mt-2'>Supports multiple files — order will be preserved</div>
              </div>
            </label>
          </div>

          <div className='mt-6'>
            {filesList.length === 0 ? (
              <div className='text-sm text-gray-500'>No files selected.</div>
            ) : (
              <ul className='space-y-2'>
                {filesList.map((f, i) => (
                  <li key={i} className='flex items-center justify-between bg-gray-50 p-3 rounded-md'>
                    <div className='truncate max-w-xl'>{f.name}</div>
                    <div className='flex items-center gap-2'>
                      <div className='text-sm text-gray-500'>{(f.size/1024/1024).toFixed(2)} MB</div>
                      <button onClick={()=>removeFile(i)} className='text-sm text-red-500 hover:underline'>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='mt-6 flex gap-3'>
            <button onClick={mergePDFs} className='px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60' disabled={loading}>
              {loading ? 'Merging...' : 'Merge PDFs'}
            </button>
            <button onClick={clearAll} className='px-4 py-2 border rounded-lg'>Clear</button>
            {mergedUrl && (
              <a href={mergedUrl} download='merged.pdf' className='ml-auto px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700'>Download</a>
            )}
          </div>

          <div className='text-xs text-gray-400 mt-4'>Note: All processing is client-side. Large files may be limited by browser memory.</div>
        </div>
      </div>
    </div>
  );
}
