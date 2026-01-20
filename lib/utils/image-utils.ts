/**
 * Comprime una imagen en el lado del cliente utilizando Canvas.
 * 
 * @param file El archivo original a comprimir.
 * @param maxWidth El ancho máximo permitido (mantiene proporción).
 * @param quality La calidad de compresión (0.0 a 1.0).
 * @returns Una promesa que resuelve con el archivo comprimido.
 */
export async function compressImage(
    file: File,
    maxWidth = 1200,
    quality = 0.7
): Promise<File> {
    // Solo comprimir si es una imagen
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Si el archivo ya es pequeño (ej. < 500KB), no hace falta comprimir agresivamente
    if (file.size < 500 * 1024 && file.type === 'image/jpeg') {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Redimensionar manteniendo la proporción
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo obtener el contexto del canvas'));
                    return;
                }

                // Dibujar imagen en el canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir el canvas a blob (JPEG)
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });

                            console.log(`[v0] Imagen procesada: ${file.name} (${(file.size / 1024).toFixed(0)}KB -> ${(compressedFile.size / 1024).toFixed(0)}KB)`);

                            // Si por alguna razón el "comprimido" es más grande que el original, devolver el original
                            if (compressedFile.size > file.size) {
                                resolve(file);
                            } else {
                                resolve(compressedFile);
                            }
                        } else {
                            reject(new Error('Error al generar el Blob de la imagen'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Error al cargar la imagen en memoria'));
        };
        reader.onerror = (error) => reject(error);
    });
}
