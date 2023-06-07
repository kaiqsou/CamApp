import { Component, ErrorHandler } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Foto } from '../models/Foto.interface';
import { FotosService } from '../services/fotos.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(public fotoService: FotosService, public actionSheetController: ActionSheetController) { }
  async ngOnInit(){
    await this.fotoService.carregarFotosSalvas();
  }
  public async showActionSheet(foto: Foto, position: number){
    const actionSheet =await this.actionSheetController.create({
      header: 'fotos',
      buttons:[{
        text: 'delete?',
        role: 'destructive',
        icon: 'trash',
        handler: () =>{
          this.fotoService.deletePicture(foto,position);
        }
      },{
        text: 'cancelar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          //  nao faz nada , o action sheet fecha automaticamente
        }
      }]
    });
    await actionSheet.present()
  }
  tirarFoto(){
    this.fotoService.tirarFotos();
  }
}
