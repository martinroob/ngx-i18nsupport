import {
  Component,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';
import {NormalizedMessage} from '../model/normalized-message';
import {isNullOrUndefined} from '../common/util';
import {ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR} from '@angular/forms';
import {IICUMessageCategory, IICUMessageTranslation} from '@ngx-i18nsupport/ngx-i18nsupport-lib';
import {Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
/**
 * A component used as an input field for normalized message.
 */
@Component({
  selector: 'app-normalized-message-input',
  templateUrl: './normalized-message-input.component.html',
  styleUrls: ['./normalized-message-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NormalizedMessageInputComponent),
      multi: true
    }
  ]
})
export class NormalizedMessageInputComponent implements OnInit, OnChanges, ControlValueAccessor {

  /**
   * The message to be edited or shown.
   */
  @Input() message: NormalizedMessage;

  /**
   * Flag, wether the message should be shown in normalized form.
   */
  @Input() normalized: boolean;

  /**
   * Flag, wether message is read only.
   * Then, there is no input field, but only the text is shown.
   */
  @Input() readonly: boolean;

  /**
   * Emitted when user presses Ctrl+Enter
   */
  @Output() accept = new EventEmitter<void>();

  editedMessage: NormalizedMessage;
  form: FormGroup;
  subscription: Subscription;
  disabled = false;

  propagateChange = (_: any) => {};

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!isNullOrUndefined(changes['message'])) {
      this.editedMessage = this.message.copy();
    }
    const isChanged = !isNullOrUndefined(changes['message']) || !isNullOrUndefined(changes['normalized']);
    if (isChanged) {
      this.initForm();
    }
  }

  private initForm() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.form = this.formBuilder.group({
      displayedText: [{value: this.textToDisplay(), disabled: this.disabled}],
      icuMessages: this.formBuilder.array(this.initIcuMessagesFormArray())
    });
    this.subscription = this.form.valueChanges.pipe(
        debounceTime(200)
    ).subscribe(formValue => {
        this.valueChanged(formValue);
    });
  }

  private initIcuMessagesFormArray() {
    if (!this.isICUMessage()) {
      return [];
    }
    return this.getICUMessageCategories().map((category) => {
      return [category.getMessageNormalized().asDisplayString()];
    });
  }

  /**
   * Write a new value to the element.
   */
  writeValue(obj: any): void {
  }

  /**
   * Set the function to be called when the control receives a change event.
   */
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  /**
   * Set the function to be called when the control receives a touch event.
   */
  registerOnTouched(fn: any): void {

  }

  /**
   * This function is called when the control status changes to or from "DISABLED".
   * Depending on the value, it will enable or disable the appropriate DOM element.
   * @param isDisabled isDisabled
   */
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.form = this.formBuilder.group({displayedText: [{value: this.textToDisplay(), disabled: this.disabled}]});
  }

  /**
   * The text to be shown in the readonly mode.
   * @return text to be shown in readonly mode
   */
  textToDisplay(): string {
    if (this.editedMessage) {
      return this.editedMessage.dislayText(this.normalized);
    } else {
      return '';
    }
  }

  /**
   * Test, wether it is an ICU message.
   */
  isICUMessage(): boolean {
    if (this.message) {
      return this.message.isICUMessage();
    } else {
      return false;
    }
  }

  /**
   * Get list of categories if it is an ICU Message.
   * @return categories or empty array.
   */
  getICUMessageCategories(): IICUMessageCategory[] {
    if (isNullOrUndefined(this.message)) {
      return [];
    }
    const icuMessage = this.message.getICUMessage();
    if (isNullOrUndefined(icuMessage)) {
      return [];
    }
    return icuMessage.getCategories();
  }

  private valueChanged(value: any) {
    if (!this.readonly && this.message) {
      if (!this.isICUMessage() || !this.normalized) {
        const textEntered = value.displayedText;
        this.editedMessage = this.message.translate(textEntered, this.normalized);
      } else {
        const categories = this.getICUMessageCategories();
        const valuesEntered = value.icuMessages;
        const translation: IICUMessageTranslation = {};
        for (let i = 0; i < value.icuMessages.length; i++) {
          translation[categories[i].getCategory()] = valuesEntered[i];
        }
        this.editedMessage = this.message.translateICUMessage(translation);
      }
    } else {
    }
    this.propagateChange(this.editedMessage);
  }
}
