<script setup lang="ts">
import fileToBase64 from "@/utils/fileToBase64";
import pngCountourCrop from "@/utils/png-countour-crop";
import debounce from "lodash.debounce";
import { rad } from "@/utils/toRadians";
import WebGL from "@/utils/webGLCheck";
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  TextureLoader,
  CylinderGeometry,
} from "three";
import { nextTick, onMounted, ref } from "vue";

const scale = window.innerWidth > 906 ? 0 : window.innerWidth / 906;
const scene = new Scene();
const camera = new PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  500
);
camera.position.set(0, 0, 200 + 200 * scale);
camera.lookAt(0, 0, 0);
const webGLIsAvailable = ref(false);
const renderer = new WebGLRenderer();
renderer.setClearColor(0xffffff, 1);

const onMountedHandler = () => {
  const texture = new TextureLoader().load("src/assets/mug.png", () => {
    const geometry = new PlaneGeometry(100, 100);
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const plane = new Mesh(geometry, material);
    scene.add(plane);

    renderer.render(scene, camera);
  });
  webGLIsAvailable.value = WebGL.isWebGLAvailable();

  if (!webGLIsAvailable.value) {
    return;
  }

  nextTick(() => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    const canvas = document.getElementById("canvas");
    canvas?.replaceWith(renderer.domElement);
  });

  window.addEventListener("resize", onResizeHandler);
};

const onResizeHandler = debounce(() => {
  window.removeEventListener("resize", onResizeHandler);
  renderer.clear();
  const scale = window.innerWidth > 906 ? 0 : window.innerWidth / 906;

  camera.position.set(0, 0, 200 + 200 * scale);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  onMountedHandler();
}, 50);

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;

  if (!input.files?.length) {
    return;
  }

  const fileURI = await fileToBase64(input.files[0]);
  const fileCroppedURI = await pngCountourCrop(fileURI as string);
  const texture = new TextureLoader().load(fileCroppedURI as string, () => {
    const mesh = new Mesh(
      new CylinderGeometry(21, 21, 35, 30, 1, true, 0, Math.PI - Math.PI / 6),
      new MeshBasicMaterial({
        map: texture,
        transparent: true,
      })
    );
    mesh.position.set(5, 3, 0);
    mesh.rotateY(rad(-75));
    mesh.rotateZ(rad(-15));
    mesh.rotateX(rad(4));
    scene.add(mesh);
    renderer.render(scene, camera);
  });
};
const onUploadClick = () => {
  return hiddenInnputRef.value.click();
};
const hiddenInnputRef = ref();

onMounted(onMountedHandler);
</script>

<template>
  <div v-if="!webGLIsAvailable">
    Application is not available on this device, please try another one.
  </div>
  <div v-else id="canvas"></div>
  <div class="controls">
    <input type="file" hidden @change="onFileChange" ref="hiddenInnputRef" />
    <button class="controls__upload" @click="onUploadClick">Upload logo</button>
  </div>
</template>

<style scoped>
.controls {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
}
.controls__upload {
  border: none;
  background-color: #000;
  border-radius: 10px;
  color: #fff;
  padding: 20px 50px;
  font-size: 35px;
  cursor: pointer;
  transition: 0.2s ease background;
}
.controls__upload:hover {
  background-color: #7e7e7e;
}
.controls__upload:active {
  background-color: #eee;
}

@media (max-width: 600px) {
  .controls__upload {
    padding: 10px 30px;
    font-size: 18px;
  }
}
</style>
