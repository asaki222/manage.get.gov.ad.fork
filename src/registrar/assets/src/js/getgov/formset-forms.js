/**
 * Prepare the namerservers and DS data forms delete buttons
 * We will call this on the forms init, and also every time we add a form
 * 
 */
function removeForm(e, formLabel, isNameserversForm, addButton, formIdentifier){
  let totalForms = document.querySelector(`#id_${formIdentifier}-TOTAL_FORMS`);
  let formToRemove = e.target.closest(".repeatable-form");
  formToRemove.remove();
  let forms = document.querySelectorAll(".repeatable-form");
  totalForms.setAttribute('value', `${forms.length}`);

  let formNumberRegex = RegExp(`form-(\\d){1}-`, 'g');
  let formLabelRegex = RegExp(`${formLabel} (\\d+){1}`, 'g');
  // For the example on Nameservers
  let formExampleRegex = RegExp(`ns(\\d+){1}`, 'g');

  forms.forEach((form, index) => {
    // Iterate over child nodes of the current element
    Array.from(form.querySelectorAll('label, input, select')).forEach((node) => {
      // Iterate through the attributes of the current node
      Array.from(node.attributes).forEach((attr) => {
        // Check if the attribute value matches the regex
        if (formNumberRegex.test(attr.value)) {
          // Replace the attribute value with the updated value
          attr.value = attr.value.replace(formNumberRegex, `form-${index}-`);
        }
      });
    });

    // h2 and legend for DS form, label for nameservers  
    Array.from(form.querySelectorAll('h2, legend, label, p')).forEach((node) => {

      let innerSpan = node.querySelector('span')
      if (innerSpan) {
        innerSpan.textContent = innerSpan.textContent.replace(formLabelRegex, `${formLabel} ${index + 1}`);
      } else {
        node.textContent = node.textContent.replace(formLabelRegex, `${formLabel} ${index + 1}`);
        node.textContent = node.textContent.replace(formExampleRegex, `ns${index + 1}`);
      }
      
      // If the node is a nameserver label, one of the first 2 which was previously 3 and up (not required)
      // inject the USWDS required markup and make sure the INPUT is required
      if (isNameserversForm && index <= 1 && node.innerHTML.includes('server') && !node.innerHTML.includes('*')) {

        // Remove the word optional
        innerSpan.textContent = innerSpan.textContent.replace(/\s*\(\s*optional\s*\)\s*/, '');

        // Create a new element
        const newElement = document.createElement('abbr');
        newElement.textContent = '*';
        newElement.setAttribute("title", "required");
        newElement.classList.add("usa-hint", "usa-hint--required");

        // Append the new element to the label
        node.appendChild(newElement);
        // Find the next sibling that is an input element
        let nextInputElement = node.nextElementSibling;

        while (nextInputElement) {
          if (nextInputElement.tagName === 'INPUT') {
            // Found the next input element
            nextInputElement.setAttribute("required", "")
            break;
          }
          nextInputElement = nextInputElement.nextElementSibling;
        }
        nextInputElement.required = true;
      }
    });

    // Display the add more button if we have less than 13 forms
    if (isNameserversForm && forms.length <= 13) {
      addButton.removeAttribute("disabled");
    }

    if (isNameserversForm && forms.length < 3) {
      // Hide the delete buttons on the remaining nameservers
      Array.from(form.querySelectorAll('.delete-record')).forEach((deleteButton) => {
        deleteButton.setAttribute("disabled", "true");
      });
    }
  });
}
  
/**
 * Delete method for formsets using the DJANGO DELETE widget (Other Contacts)
 * 
 */
function markForm(e, formLabel){
  // Unlike removeForm, we only work with the visible forms when using DJANGO's DELETE widget
  let totalShownForms = document.querySelectorAll(`.repeatable-form:not([style*="display: none"])`).length;

  if (totalShownForms == 1) {
    // toggle the radio buttons
    let radioButton = document.querySelector('input[name="other_contacts-has_other_contacts"][value="False"]');
    radioButton.checked = true;
    // Trigger the change event
    let event = new Event('change');
    radioButton.dispatchEvent(event);
  } else {

    // Grab the hidden delete input and assign a value DJANGO will look for
    let formToRemove = e.target.closest(".repeatable-form");
    if (formToRemove) {
      let deleteInput = formToRemove.querySelector('input[class="deletion"]');
      if (deleteInput) {
        deleteInput.value = 'on';
      }
    }

    // Set display to 'none'
    formToRemove.style.display = 'none';
  }
  
  // Update h2s on the visible forms only. We won't worry about the forms' identifiers
  let shownForms = document.querySelectorAll(`.repeatable-form:not([style*="display: none"])`);
  let formLabelRegex = RegExp(`${formLabel} (\\d+){1}`, 'g');
  shownForms.forEach((form, index) => {
    // Iterate over child nodes of the current element
    Array.from(form.querySelectorAll('h2')).forEach((node) => {
        node.textContent = node.textContent.replace(formLabelRegex, `${formLabel} ${index + 1}`);
    });
  });
}
  
/**
 * Prepare the namerservers, DS data and Other Contacts formsets' delete button
 * for the last added form. We call this from the Add function
 * 
 */
function prepareNewDeleteButton(btn, formLabel) {
  let formIdentifier = "form"
  let isNameserversForm = document.querySelector(".nameservers-form");
  let isOtherContactsForm = document.querySelector(".other-contacts-form");
  let addButton = document.querySelector("#add-form");

  if (isOtherContactsForm) {
    formIdentifier = "other_contacts";
    // We will mark the forms for deletion
    btn.addEventListener('click', function(e) {
      markForm(e, formLabel);
    });
  } else {
    // We will remove the forms and re-order the formset
    btn.addEventListener('click', function(e) {
      removeForm(e, formLabel, isNameserversForm, addButton, formIdentifier);
    });
  }
}
  
/**
 * Prepare the namerservers, DS data and Other Contacts formsets' delete buttons
 * We will call this on the forms init
 * 
 */
function prepareDeleteButtons(formLabel) {
  let formIdentifier = "form"
  let deleteButtons = document.querySelectorAll(".delete-record");
  let isNameserversForm = document.querySelector(".nameservers-form");
  let isOtherContactsForm = document.querySelector(".other-contacts-form");
  let addButton = document.querySelector("#add-form");
  if (isOtherContactsForm) {
    formIdentifier = "other_contacts";
  }
  
  // Loop through each delete button and attach the click event listener
  deleteButtons.forEach((deleteButton) => {
    if (isOtherContactsForm) {
      // We will mark the forms for deletion
      deleteButton.addEventListener('click', function(e) {
        markForm(e, formLabel);
      });
    } else {
      // We will remove the forms and re-order the formset
      deleteButton.addEventListener('click', function(e) {
        removeForm(e, formLabel, isNameserversForm, addButton, formIdentifier);
      });
    }
  });
}
  
/**
 * DJANGO formset's DELETE widget
 * On form load, hide deleted forms, ie. those forms with hidden input of class 'deletion'
 * with value='on'
 */
function hideDeletedForms() {
  let hiddenDeleteButtonsWithValueOn = document.querySelectorAll('input[type="hidden"].deletion[value="on"]');

  // Iterating over the NodeList of hidden inputs
  hiddenDeleteButtonsWithValueOn.forEach(function(hiddenInput) {
      // Finding the closest parent element with class "repeatable-form" for each hidden input
      var repeatableFormToHide = hiddenInput.closest('.repeatable-form');
  
      // Checking if a matching parent element is found for each hidden input
      if (repeatableFormToHide) {
          // Setting the display property to "none" for each matching parent element
          repeatableFormToHide.style.display = 'none';
      }
  });
}

/**
 * A function that attaches a click handler for our dynamic formsets
 *
 * Only does something on a few pages, but it should be fast enough to run
 * it everywhere.
 */
export function initFormsetsForms() {
  let formIdentifier = "form"
  let repeatableForm = document.querySelectorAll(".repeatable-form");
  let container = document.querySelector("#form-container");
  let addButton = document.querySelector("#add-form");
  let cloneIndex = 0;
  let formLabel = '';
  let isNameserversForm = document.querySelector(".nameservers-form");
  let isOtherContactsForm = document.querySelector(".other-contacts-form");
  let isDsDataForm = document.querySelector(".ds-data-form");
  let isDotgovDomain = document.querySelector(".dotgov-domain-form");
  // The Nameservers formset features 2 required and 11 optionals
  if (isNameserversForm) {
    // cloneIndex = 2;
    formLabel = "Name server";
  // DNSSEC: DS Data
  } else if (isDsDataForm) {
    formLabel = "DS data record";
  // The Other Contacts form
  } else if (isOtherContactsForm) {
    formLabel = "Organization contact";
    container = document.querySelector("#other-employees");
    formIdentifier = "other_contacts"
  } else if (isDotgovDomain) {
    formIdentifier = "dotgov_domain"
  }
  let totalForms = document.querySelector(`#id_${formIdentifier}-TOTAL_FORMS`);

  // On load: Disable the add more button if we have 13 forms
  if (isNameserversForm && document.querySelectorAll(".repeatable-form").length == 13) {
    addButton.setAttribute("disabled", "true");
  }

  // Hide forms which have previously been deleted
  hideDeletedForms()

  // Attach click event listener on the delete buttons of the existing forms
  prepareDeleteButtons(formLabel);

  if (addButton)
    addButton.addEventListener('click', addForm);

  function addForm(e){
      let forms = document.querySelectorAll(".repeatable-form");
      let formNum = forms.length;
      let newForm = repeatableForm[cloneIndex].cloneNode(true);
      let formNumberRegex = RegExp(`${formIdentifier}-(\\d){1}-`,'g');
      let formLabelRegex = RegExp(`${formLabel} (\\d){1}`, 'g');
      // For the eample on Nameservers
      let formExampleRegex = RegExp(`ns(\\d){1}`, 'g');

      // Some Nameserver form checks since the delete can mess up the source object we're copying
      // in regards to required fields and hidden delete buttons
      if (isNameserversForm) {

        // If the source element we're copying has required on an input,
        // reset that input
        let formRequiredNeedsCleanUp = newForm.innerHTML.includes('*');
        if (formRequiredNeedsCleanUp) {
          newForm.querySelector('label abbr').remove();
          // Get all input elements within the container
          const inputElements = newForm.querySelectorAll("input");
          // Loop through each input element and remove the 'required' attribute
          inputElements.forEach((input) => {
            if (input.hasAttribute("required")) {
              input.removeAttribute("required");
            }
          });
        }

        // If the source element we're copying has an disabled delete button,
        // enable that button
        let deleteButton= newForm.querySelector('.delete-record');
        if (deleteButton.hasAttribute("disabled")) {
          deleteButton.removeAttribute("disabled");
        }
      }

      formNum++;

      newForm.innerHTML = newForm.innerHTML.replace(formNumberRegex, `${formIdentifier}-${formNum-1}-`);
      if (isOtherContactsForm) {
        // For the other contacts form, we need to update the fieldset headers based on what's visible vs hidden,
        // since the form on the backend employs Django's DELETE widget.
        let totalShownForms = document.querySelectorAll(`.repeatable-form:not([style*="display: none"])`).length;
        newForm.innerHTML = newForm.innerHTML.replace(formLabelRegex, `${formLabel} ${totalShownForms + 1}`);
      } else {
        // Nameservers form is cloned from index 2 which has the word optional on init, does not have the word optional
        // if indices 0 or 1 have been deleted
        let containsOptional = newForm.innerHTML.includes('(optional)');
        if (isNameserversForm && !containsOptional) {
          newForm.innerHTML = newForm.innerHTML.replace(formLabelRegex, `${formLabel} ${formNum} (optional)`);
        } else {
          newForm.innerHTML = newForm.innerHTML.replace(formLabelRegex, `${formLabel} ${formNum}`);
        }
      }
      newForm.innerHTML = newForm.innerHTML.replace(formExampleRegex, `ns${formNum}`);
      newForm.innerHTML = newForm.innerHTML.replace(/\n/g, '');  // Remove newline characters
      newForm.innerHTML = newForm.innerHTML.replace(/>\s*</g, '><');  // Remove spaces between tags
      container.insertBefore(newForm, addButton);

      newForm.style.display = 'block';

      let inputs = newForm.querySelectorAll("input");
      // Reset the values of each input to blank
      inputs.forEach((input) => {
        input.classList.remove("usa-input--error");
        input.classList.remove("usa-input--success");
        if (input.type === "text" || input.type === "number" || input.type === "password" || input.type === "email" || input.type === "tel") {
          input.value = ""; // Set the value to an empty string
          
        } else if (input.type === "checkbox" || input.type === "radio") {
          input.checked = false; // Uncheck checkboxes and radios
        }
      });

      // Reset any existing validation classes
      let selects = newForm.querySelectorAll("select");
      selects.forEach((select) => {
        select.classList.remove("usa-input--error");
        select.classList.remove("usa-input--success");
        select.selectedIndex = 0; // Set the value to an empty string
      });

      let labels = newForm.querySelectorAll("label");
      labels.forEach((label) => {
        label.classList.remove("usa-label--error");
        label.classList.remove("usa-label--success");
      });

      let usaFormGroups = newForm.querySelectorAll(".usa-form-group");
      usaFormGroups.forEach((usaFormGroup) => {
        usaFormGroup.classList.remove("usa-form-group--error");
        usaFormGroup.classList.remove("usa-form-group--success");
      });

      // Remove any existing error and success messages
      let usaMessages = newForm.querySelectorAll(".usa-error-message, .usa-alert");
      usaMessages.forEach((usaErrorMessage) => {
        let parentDiv = usaErrorMessage.closest('div');
        if (parentDiv) {
          parentDiv.remove(); // Remove the parent div if it exists
        }
      });

      totalForms.setAttribute('value', `${formNum}`);

      // Attach click event listener on the delete buttons of the new form
      let newDeleteButton = newForm.querySelector(".delete-record");
      if (newDeleteButton)
        prepareNewDeleteButton(newDeleteButton, formLabel);

      // Disable the add more button if we have 13 forms
      if (isNameserversForm && formNum == 13) {
        addButton.setAttribute("disabled", "true");
      }

      if (isNameserversForm && forms.length >= 2) {
        // Enable the delete buttons on the nameservers
        forms.forEach((form, index) => {
          Array.from(form.querySelectorAll('.delete-record')).forEach((deleteButton) => {
            deleteButton.removeAttribute("disabled");
          });
        });
      }
  }
}

export function triggerModalOnDsDataForm() {
  let saveButon = document.querySelector("#save-ds-data");

  // The view context will cause a hitherto hidden modal trigger to
  // show up. On save, we'll test for that modal trigger appearing. We'll
  // run that test once every 100 ms for 5 secs, which should balance performance
  // while accounting for network or lag issues.
  if (saveButon) {
    let i = 0;
    var tryToTriggerModal = setInterval(function() {
        i++;
        if (i > 100) {
          clearInterval(tryToTriggerModal);
        }
        let modalTrigger = document.querySelector("#ds-toggle-dnssec-alert");
        if (modalTrigger) {
          modalTrigger.click()
          clearInterval(tryToTriggerModal);
        }
    }, 50);
  }
}

/**
 * Disable the delete buttons on nameserver forms on page load if < 3 forms
 *
 */
export function nameserversFormListener() {
  let isNameserversForm = document.querySelector(".nameservers-form");
  if (isNameserversForm) {
    let forms = document.querySelectorAll(".repeatable-form");
    if (forms.length < 3) {
      // Hide the delete buttons on the 2 nameservers
      forms.forEach((form) => {
        Array.from(form.querySelectorAll('.delete-record')).forEach((deleteButton) => {
          deleteButton.setAttribute("disabled", "true");
        });
      });
    }
  }
}
