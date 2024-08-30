const $ = selector => document.querySelector(selector);
const btnGenerar = $('#btn-generar');
const pdfInput = $('#pdfInput');
const listPDF = [];
btnGenerar.addEventListener('click', combinarPDFs);
pdfInput.addEventListener('change', mostrarPrimeraPaginaComoImg);

async function mostrarPrimeraPaginaComoImg() {
    const archivosPDF = pdfInput.files;

    if (archivosPDF.length === 0) {
        return;
    }
    let i = listPDF.length;  // Utiliza el tamaño actual de listPDF para el índice inicial
    for (const archivo of archivosPDF) {
        const arrayBuffer = await archivo.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1); // Primera página

        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;

        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        img.width = 200;
        img.height = 200;

        const fragmento = document.createElement('div');
        fragmento.className = 'card';
        fragmento.id = 'fragment' + i;
        fragmento.setAttribute('data-order', i);
        const cerrar = document.createElement('button');
        cerrar.className = 'closed';
        cerrar.textContent = 'x';
        fragmento.appendChild(cerrar);
        fragmento.appendChild(img);
        const divBtn = document.createElement('div');
        divBtn.className = 'div-btn';
        const next = document.createElement('button');
        next.className = 'next';
        next.innerHTML = `<i class="material-icons">arrow_forward</i>`;
        const prev = document.createElement('button');
        prev.className = 'prev';
        prev.innerHTML = `<i class="material-icons">arrow_back</i>`;
        divBtn.appendChild(prev);
        divBtn.appendChild(next);
        fragmento.appendChild(divBtn);

        $('#preview').appendChild(fragmento);
        const fragment = $('#fragment' + i);
        cerrar.addEventListener('click', () => {
            const index = listPDF.findIndex(item => item.order === i);
            listPDF.splice(index, 1);
            fragment.remove();
            actualizarOrden(); // Actualiza el orden después de eliminar
        });
        next.addEventListener('click', () => {
            const miFragmento = next.parentElement.parentElement;
            const order = parseInt(miFragmento.getAttribute('data-order'));
            intercambiarFragmentos(order, true);
        });
        prev.addEventListener('click', () => {
            const miFragmento = next.parentElement.parentElement;
            const order = parseInt(miFragmento.getAttribute('data-order'));
            intercambiarFragmentos(order, false);
        });

        listPDF.push({ 'order': i, 'pdf': arrayBuffer, 'fragment': fragment });
        i++;
    }
    pdfInput.value = '';
}
function actualizarOrden() {
    listPDF.forEach((item, index) => {
        item.order = index;
        item.fragment.setAttribute('data-order', index);
        item.fragment.id = 'fragment' + index;
    });
}

function intercambiarFragmentos(order, next) {
    const keyA = listPDF.findIndex(item => item.order === order);
    if (keyA === -1) return;
    const keyB = next ? keyA + 1 : keyA - 1;
    if (keyB < 0 || keyB >= listPDF.length) return;

    // Intercambia las posiciones de los elementos en el DOM
    const fragmentA = listPDF[keyA].fragment;
    const fragmentB = listPDF[keyB].fragment;

    // Si keyA es menor que keyB, fragmentB irá antes de fragmentA, si no, irá después
    if (next) {
        fragmentB.after(fragmentA);
    } else {
        fragmentB.before(fragmentA);
    }

    // Intercambia los elementos en el array listPDF
    [listPDF[keyA], listPDF[keyB]] = [listPDF[keyB], listPDF[keyA]];

    // Actualiza el atributo data-order e ID
    actualizarOrden();
}
async function combinarPDFs() {
    if (listPDF.length === 0) {
        alert('No hay archivos PDF para combinar');
        return;
    }

    const pdfCombinadoDoc = await PDFLib.PDFDocument.create();
    const generarListPDF = listPDF.sort((a, b) => a.order - b.order);

    for (const { pdf } of generarListPDF) {
        const pdfDoc = await PDFLib.PDFDocument.load(pdf);
        const paginas = await pdfCombinadoDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        paginas.forEach((pagina) => pdfCombinadoDoc.addPage(pagina));
    }

    const pdfCombinadoBytes = await pdfCombinadoDoc.save();
    const pdfCombinadoBlob = new Blob([pdfCombinadoBytes], { type: 'application/pdf' });

    const pdfUrl = URL.createObjectURL(pdfCombinadoBlob);
    $('#result').src = pdfUrl;
    $('#result').classList.add('success');
}