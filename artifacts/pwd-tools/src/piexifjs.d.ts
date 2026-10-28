declare module "piexifjs" {
  type Ifd = Record<number, unknown>;
  const piexifjs: {
    load(data: string): {
      "0th": Ifd; Exif: Ifd; GPS: Ifd; Interop: Ifd; "1st": Ifd; thumbnail: string | null;
    };
    dump(exifObj: {
      "0th": Ifd; Exif: Ifd; GPS: Ifd; Interop: Ifd; "1st": Ifd; thumbnail: string | null;
    }): string;
    insert(exifStr: string, jpegData: string): string;
    remove(jpegData: string): string;
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
  };
  export = piexifjs;
}
