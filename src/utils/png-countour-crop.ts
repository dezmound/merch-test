import cv from "@techstark/opencv-js";
//@ts-ignore
import Clipper from "image-clipper";
import { rad } from "./toRadians";

function getProjectionWidthHeight({
  size: { width: w, height: h },
  angle,
}: cv.RotatedRect) {
  return [
    w * Math.abs(Math.cos(rad(angle))) + h * Math.abs(Math.sin(rad(angle))),
    w * Math.abs(Math.sin(rad(angle))) + h * Math.abs(Math.cos(rad(angle))),
  ];
}

function calculateBoundingBox(rects: cv.RotatedRect[]) {
  const [projectionWidth, projectionHeight] = getProjectionWidthHeight(
    rects[0]
  );
  let left = rects[0].center.x - projectionWidth / 2;
  let right = rects[0].center.x + projectionWidth / 2;
  let bottom = rects[0].center.y + projectionHeight / 2;
  let top = rects[0].center.y - projectionHeight / 2;
  const slice = rects.slice(1);

  slice.forEach((rect) => {
    const [projectionWidth] = getProjectionWidthHeight(rect);
    const x = rect.center.x - projectionWidth / 2;

    if (x < left) {
      left = x;
    }
  });
  slice.forEach((rect) => {
    const [projectionWidth] = getProjectionWidthHeight(rect);
    const x = rect.center.x + projectionWidth / 2;

    if (x > right) {
      right = x;
    }
  });
  slice.forEach((rect) => {
    const [_, projectionHeight] = getProjectionWidthHeight(rect);
    const y = rect.center.y + projectionHeight / 2;

    if (y > bottom) {
      bottom = y;
    }
  });
  slice.forEach((rect) => {
    const [_, projectionHeight] = getProjectionWidthHeight(rect);
    const y = rect.center.y - projectionHeight / 2;

    if (y < top) {
      top = y;
    }
  });
  return [left, right, bottom, top];
}

export default async function pngCountourCrop(
  imageBase64: string
): Promise<string> {
  const img = new Image();
  img.src = imageBase64;
  const tmpCanvas = document.createElement("canvas");
  const tmpCanvasContext = tmpCanvas.getContext("2d");

  return new Promise((res) => {
    img.onload = () => {
      tmpCanvas.width = img.width;
      tmpCanvas.height = img.height;
      tmpCanvasContext?.drawImage(img, 0, 0);
      const src = cv.imread(tmpCanvas);

      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(
        src,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );
      const rects = [];
      for (let i = 0; i < (contours.size() as unknown as number); ++i) {
        rects.push(cv.minAreaRect(contours.get(i)));
      }
      const [left, right, bottom, top] = calculateBoundingBox(rects);
      Clipper(img, function () {
        //@ts-ignore
        this.crop(left, top, right - left, bottom - top).toDataURL(res);
      });
    };
  });
}
