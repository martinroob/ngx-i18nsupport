import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TranslationProject} from '../../../model/translation-project';
import {IFileDescription} from '../../common/i-file-description';
import {GithubConfiguration} from '../github-configuration';

@Component({
  selector: 'app-translation-file-from-github',
  templateUrl: './translation-file-from-github.component.html',
  styleUrls: ['./translation-file-from-github.component.css']
})
export class TranslationFileFromGithubComponent implements OnInit {

  @Input() createdProject?: TranslationProject;
  @Input() configuration: GithubConfiguration;
  @Output() fileSelected: EventEmitter<IFileDescription> = new EventEmitter();
  @Output() masterXmlFileSelected: EventEmitter<IFileDescription> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

}
