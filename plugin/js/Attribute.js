/*
 * ==========================================================================
 * Copyright (c) 2018 by eeps media.
 * Last modified 8/21/18 8:16 PM
 *
 * Created by Tim Erickson on 8/21/18 8:16 PM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 * ==========================================================================
 *
 */


class Attribute {

  constructor(iRecord, iAttributeAssignment) {
    this.name = iRecord.name;
    this.startPos = Number(iRecord.startPos);
    this.width = iRecord.width;
    this.format = iRecord.format;
    this.categories = iRecord.categories;
    this.groupNumber = iAttributeAssignment && iAttributeAssignment.group;
    this.description = iRecord.description;
    this.chosen = iAttributeAssignment && iAttributeAssignment.defCheck;
    this.displayMe = iAttributeAssignment; //Boolean(iRecord.defshow);
    this.hasCheckbox = this.displayMe;
    this.checkboxID = this.name + "Checkbox";

    this.title = iRecord.labl;
    if (!this.title) {
      this.title = this.name;
    }
  }

  decodeValue(iValue) {
    let startIndex = this.startPos - 1;
    let out = iValue.slice(startIndex, startIndex + this.width);

    if (this.format === 'categorical') {
      let nOut = Number(out);
      if (this.categories[nOut]) {
        out = this.categories[Number(nOut)];
      }
    }
    return out;
  }
}

