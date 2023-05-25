import { Foto } from './../models/Foto.interface';
import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class FotosService {
  //lista das fotos amazenadas no dispositivo
  fotos : Foto[] = []
  //cria uma variavel para armazenar o local fisico das fotos
  private FOTO_ARMAZENAMENTO: String ='Fotos'

  constructor() { }
}
