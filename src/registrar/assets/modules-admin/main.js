/**
 * @file get-gov-admin.js includes custom code for the .gov registrar admin portal.
 *
 * Constants and helper functions are at the top.
 * Event handlers are in the middle.
 * Initialization (run-on-load) stuff goes at the bottom.
 */

// <<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Helper functions.

/**
 * Hide element
 *
*/
const hideElement = (element) => {
    if (element && !element.classList.contains("display-none"))
        element.classList.add('display-none');
};

/**
 * Show element
 *
 */
const showElement = (element) => {
    if (element && element.classList.contains("display-none"))
        element.classList.remove('display-none');
};

/** Either sets attribute target="_blank" to a given element, or removes it */
function openInNewTab(el, removeAttribute = false){
    if(removeAttribute){
        el.setAttribute("target", "_blank");
    }else{
        el.removeAttribute("target", "_blank");
    }
};

// Adds or removes a boolean from our session
function addOrRemoveSessionBoolean(name, add){
    if (add) {
        sessionStorage.setItem(name, "true");
    }else {
        sessionStorage.removeItem(name); 
    }
}

// <<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Event handlers.
/** Helper function that handles business logic for the suborganization field.
 * Can be used anywhere the suborganization dropdown exists
*/
function handleSuborganizationFields(
    portfolioDropdownSelector="#id_portfolio",
    suborgDropdownSelector="#id_sub_organization", 
    requestedSuborgFieldSelector=".field-requested_suborganization", 
    suborgCitySelector=".field-suborganization_city", 
    suborgStateTerritorySelector=".field-suborganization_state_territory"
) {
    // These dropdown are select2 fields so they must be interacted with via jquery
    const portfolioDropdown = django.jQuery(portfolioDropdownSelector)
    const suborganizationDropdown = django.jQuery(suborgDropdownSelector)
    const requestedSuborgField = document.querySelector(requestedSuborgFieldSelector);
    const suborgCity = document.querySelector(suborgCitySelector);
    const suborgStateTerritory = document.querySelector(suborgStateTerritorySelector);
    if (!suborganizationDropdown || !requestedSuborgField || !suborgCity || !suborgStateTerritory) {
        console.error("Requested suborg fields not found.");
        return;
    }

    function toggleSuborganizationFields() {
        if (portfolioDropdown.val() && !suborganizationDropdown.val()) {
            showElement(requestedSuborgField);
            showElement(suborgCity);
            showElement(suborgStateTerritory);
        }else {
            hideElement(requestedSuborgField);
            hideElement(suborgCity);
            hideElement(suborgStateTerritory);
        }
    }

    // Run the function once on page startup, then attach an event listener
    toggleSuborganizationFields();
    suborganizationDropdown.on("change", toggleSuborganizationFields);
    portfolioDropdown.on("change", toggleSuborganizationFields);
}


/**
 * This function handles the portfolio selection as well as display of
 * portfolio-related fields in the DomainRequest Form.
 * 
 * IMPORTANT NOTE: The logic in this method is paired dynamicPortfolioFields
*/
function handlePortfolioSelection() {
    // These dropdown are select2 fields so they must be interacted with via jquery
    const portfolioDropdown = django.jQuery("#id_portfolio");
    const suborganizationDropdown = django.jQuery("#id_sub_organization");
    const suborganizationField = document.querySelector(".field-sub_organization");
    const requestedSuborganizationField = document.querySelector(".field-requested_suborganization");
    const suborganizationCity = document.querySelector(".field-suborganization_city");
    const suborganizationStateTerritory = document.querySelector(".field-suborganization_state_territory");
    const seniorOfficialField = document.querySelector(".field-senior_official");
    const otherEmployeesField = document.querySelector(".field-other_contacts");
    const noOtherContactsRationaleField = document.querySelector(".field-no_other_contacts_rationale");
    const cisaRepresentativeFirstNameField = document.querySelector(".field-cisa_representative_first_name");
    const cisaRepresentativeLastNameField = document.querySelector(".field-cisa_representative_last_name");
    const cisaRepresentativeEmailField = document.querySelector(".field-cisa_representative_email");
    const orgTypeFieldSet = document.querySelector(".field-is_election_board").parentElement;
    const orgTypeFieldSetDetails = orgTypeFieldSet.nextElementSibling;
    const orgNameFieldSet = document.querySelector(".field-organization_name").parentElement;
    const orgNameFieldSetDetails = orgNameFieldSet.nextElementSibling;
    const portfolioSeniorOfficialField = document.querySelector(".field-portfolio_senior_official");
    const portfolioSeniorOfficial = portfolioSeniorOfficialField.querySelector(".readonly");
    const portfolioSeniorOfficialAddress = portfolioSeniorOfficialField.querySelector(".dja-address-contact-list");
    const portfolioOrgTypeFieldSet = document.querySelector(".field-portfolio_organization_type").parentElement;
    const portfolioOrgType = document.querySelector(".field-portfolio_organization_type .readonly");
    const portfolioFederalTypeField = document.querySelector(".field-portfolio_federal_type");
    const portfolioFederalType = portfolioFederalTypeField.querySelector(".readonly");
    const portfolioOrgNameField = document.querySelector(".field-portfolio_organization_name")
    const portfolioOrgName = portfolioOrgNameField.querySelector(".readonly");
    const portfolioOrgNameFieldSet = portfolioOrgNameField.parentElement;
    const portfolioOrgNameFieldSetDetails = portfolioOrgNameFieldSet.nextElementSibling;
    const portfolioFederalAgencyField = document.querySelector(".field-portfolio_federal_agency");
    const portfolioFederalAgency = portfolioFederalAgencyField.querySelector(".readonly");
    const portfolioStateTerritory = document.querySelector(".field-portfolio_state_territory .readonly");
    const portfolioAddressLine1 = document.querySelector(".field-portfolio_address_line1 .readonly");
    const portfolioAddressLine2 = document.querySelector(".field-portfolio_address_line2 .readonly");
    const portfolioCity = document.querySelector(".field-portfolio_city .readonly");
    const portfolioZipcode = document.querySelector(".field-portfolio_zipcode .readonly");
    const portfolioUrbanizationField = document.querySelector(".field-portfolio_urbanization");
    const portfolioUrbanization = portfolioUrbanizationField.querySelector(".readonly");
    const portfolioJsonUrl = document.getElementById("portfolio_json_url")?.value || null;
    let isPageLoading = true;

   /**
     * Fetches portfolio data by ID using an AJAX call.
     *
     * @param {number|string} portfolio_id - The ID of the portfolio to retrieve.
     * @returns {Promise<Object|null>} - A promise that resolves to the portfolio data object if successful,
     *                                   or null if there was an error.
     *
     * This function performs an asynchronous fetch request to retrieve portfolio data.
     * If the request is successful, it returns the portfolio data as an object.
     * If an error occurs during the request or the data contains an error, it logs the error
     * to the console and returns null.
     */
    function getPortfolio(portfolio_id) {
        return fetch(`${portfolioJsonUrl}?id=${portfolio_id}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("Error in AJAX call: " + data.error);
                    return null;
                } else {
                    return data;
                }
            })
            .catch(error => {
                console.error("Error retrieving portfolio", error);
                return null;
            });
    }

    /**
     * Updates various UI elements with the data from a given portfolio object.
     *
     * @param {Object} portfolio - The portfolio data object containing values to populate in the UI.
     *
     * This function updates multiple fields in the UI to reflect data in the `portfolio` object:
     * - Clears and replaces selections in the `suborganizationDropdown` with values from `portfolio.suborganizations`.
     * - Calls `updatePortfolioSeniorOfficial` to set the senior official information.
     * - Sets the portfolio organization type, federal type, name, federal agency, and other address-related fields.
     *
     * The function expects that elements like `portfolioOrgType`, `portfolioFederalAgency`, etc., 
     * are already defined and accessible in the global scope.
     */
    function updatePortfolioFieldsData(portfolio) {
        // replace selections in suborganizationDropdown with
        // values in portfolio.suborganizations
        suborganizationDropdown.empty();
        // update portfolio senior official
        updatePortfolioSeniorOfficial(portfolio.senior_official);
        // update portfolio organization type
        portfolioOrgType.innerText = portfolio.organization_type;
        // update portfolio federal type
        portfolioFederalType.innerText = portfolio.federal_type
        // update portfolio organization name
        portfolioOrgName.innerText = portfolio.organization_name;
        // update portfolio federal agency
        portfolioFederalAgency.innerText = portfolio.federal_agency ? portfolio.federal_agency.agency : '';
        // update portfolio state
        portfolioStateTerritory.innerText = portfolio.state_territory;
        // update portfolio address line 1
        portfolioAddressLine1.innerText = portfolio.address_line1;
        // update portfolio address line 2
        portfolioAddressLine2.innerText = portfolio.address_line2;
        // update portfolio city
        portfolioCity.innerText = portfolio.city;
        // update portfolio zip code
        portfolioZipcode.innerText = portfolio.zipcode
        // update portfolio urbanization
        portfolioUrbanization.innerText = portfolio.urbanization;
    }

    /**
     * Updates the UI to display the senior official information from a given object.
     *
     * @param {Object} senior_official - The senior official's data object, containing details like 
     * first name, last name, and ID. If `senior_official` is null, displays a default message.
     *
     * This function:
     * - Displays the senior official's name as a link (if available) in the `portfolioSeniorOfficial` element.
     * - If a senior official exists, it sets `portfolioSeniorOfficialAddress` to show the official's contact info 
     *   and displays it by calling `updateSeniorOfficialContactInfo`.
     * - If no senior official is provided, it hides `portfolioSeniorOfficialAddress` and shows a "No senior official found." message.
     *
     * Dependencies:
     * - Expects the `portfolioSeniorOfficial` and `portfolioSeniorOfficialAddress` elements to be available globally.
     * - Uses `showElement` and `hideElement` for visibility control.
     */
    function updatePortfolioSeniorOfficial(senior_official) {
        if (senior_official) {
            let seniorOfficialName = [senior_official.first_name, senior_official.last_name].join(' ');
            let seniorOfficialLink = `<a href=/admin/registrar/seniorofficial/${senior_official.id}/change/ class='test'>${seniorOfficialName}</a>`
            portfolioSeniorOfficial.innerHTML = seniorOfficialName ? seniorOfficialLink : "-";
            updateSeniorOfficialContactInfo(portfolioSeniorOfficialAddress, senior_official);
            showElement(portfolioSeniorOfficialAddress);
        } else {
            portfolioSeniorOfficial.innerText = "No senior official found.";
            hideElement(portfolioSeniorOfficialAddress);
        }
    }

    /**
     * Populates and displays contact information for a senior official within a specified address field element.
     *
     * @param {HTMLElement} addressField - The DOM element containing contact info fields for the senior official.
     * @param {Object} senior_official - The senior official's data object, containing properties like title, email, and phone.
     *
     * This function:
     * - Sets the `title`, `email`, and `phone` fields in `addressField` to display the senior official's data.
     * - Updates the `titleSpan` with the official's title, or "None" if unavailable.
     * - Updates the `emailSpan` with the official's email, or "None" if unavailable. 
     * - If an email is provided, populates `hiddenInput` with the email for copying and shows the `copyButton`.
     * - If no email is provided, hides the `copyButton`.
     * - Updates the `phoneSpan` with the official's phone number, or "None" if unavailable.
     *
     * Dependencies:
     * - Uses `showElement` and `hideElement` to control visibility of the `copyButton`.
     * - Expects `addressField` to have specific classes (.contact_info_title, .contact_info_email, etc.) for query selectors to work.
     */
    function updateSeniorOfficialContactInfo(addressField, senior_official) {
        const titleSpan = addressField.querySelector(".contact_info_title");
        const emailSpan = addressField.querySelector(".contact_info_email");
        const phoneSpan = addressField.querySelector(".contact_info_phone");
        const hiddenInput = addressField.querySelector("input");
        const copyButton = addressField.querySelector(".admin-icon-group");
        if (titleSpan) { 
            titleSpan.textContent = senior_official.title || "None";
        };
        if (emailSpan) {
            emailSpan.textContent = senior_official.email || "None";
            if (senior_official.email) {
                hiddenInput.value = senior_official.email;
                showElement(copyButton);
            }else {
                hideElement(copyButton);
            }
        }
        if (phoneSpan) {
            phoneSpan.textContent = senior_official.phone || "None";
        };
    }

    /**
     * Dynamically updates the visibility of certain portfolio fields based on specific conditions.
     *
     * This function adjusts the display of fields within the portfolio UI based on:
     * - The presence of a senior official's contact information.
     * - The selected state or territory, affecting the visibility of the urbanization field.
     * - The organization type (Federal vs. non-Federal), toggling the visibility of related fields.
     *
     * Functionality:
     * 1. **Senior Official Contact Info Display**:
     *    - If `portfolioSeniorOfficial` contains "No additional contact information found",
     *      hides `portfolioSeniorOfficialAddress`; otherwise, shows it.
     *
     * 2. **Urbanization Field Display**:
     *    - Displays `portfolioUrbanizationField` only when the `portfolioStateTerritory` value is "PR" (Puerto Rico).
     *
     * 3. **Federal Organization Type Display**:
     *    - If `portfolioOrgType` is "Federal", hides `portfolioOrgNameField` and shows both `portfolioFederalAgencyField`
     *      and `portfolioFederalTypeField`.
     *    - If not Federal, shows `portfolioOrgNameField` and hides `portfolioFederalAgencyField` and `portfolioFederalTypeField`.
     *    - Certain text fields (Organization Type, Organization Name, Federal Type, Federal Agency) updated to links
     *      to edit the portfolio
     *
     * Dependencies:
     * - Expects specific elements to be defined globally (`portfolioSeniorOfficial`, `portfolioUrbanizationField`, etc.).
     * - Uses `showElement` and `hideElement` functions to control element visibility.
     */
    function updatePortfolioFieldsDataDynamicDisplay() {

        // Handle visibility of senior official's contact information
        if (portfolioSeniorOfficial.innerText.includes("No senior official found.")) {
            hideElement(portfolioSeniorOfficialAddress);
        } else {
            showElement(portfolioSeniorOfficialAddress);
        }

        // Handle visibility of urbanization field based on state/territory value
        let portfolioStateTerritoryValue = portfolioStateTerritory.innerText;
        if (portfolioStateTerritoryValue === "PR") {
            showElement(portfolioUrbanizationField);
        } else {
            hideElement(portfolioUrbanizationField);
        }

        // Handle visibility of fields based on organization type (Federal vs. others)
        if (portfolioOrgType.innerText === "Federal") {
            hideElement(portfolioOrgNameField);
            showElement(portfolioFederalAgencyField);
            showElement(portfolioFederalTypeField);
        } else {
            showElement(portfolioOrgNameField);
            hideElement(portfolioFederalAgencyField);
            hideElement(portfolioFederalTypeField);
        }

        // Modify the display of certain fields to convert them from text to links
        // to edit the portfolio
        let portfolio_id = portfolioDropdown.val();
        let portfolioEditUrl = `/admin/registrar/portfolio/${portfolio_id}/change/`;
        let portfolioOrgTypeValue = portfolioOrgType.innerText;
        portfolioOrgType.innerHTML = `<a href=${portfolioEditUrl}>${portfolioOrgTypeValue}</a>`;
        let portfolioOrgNameValue = portfolioOrgName.innerText;
        portfolioOrgName.innerHTML = `<a href=${portfolioEditUrl}>${portfolioOrgNameValue}</a>`;
        let portfolioFederalAgencyValue = portfolioFederalAgency.innerText;
        portfolioFederalAgency.innerHTML = `<a href=${portfolioEditUrl}>${portfolioFederalAgencyValue}</a>`;
        let portfolioFederalTypeValue = portfolioFederalType.innerText;
        if (portfolioFederalTypeValue !== '-')
            portfolioFederalType.innerHTML = `<a href=${portfolioEditUrl}>${portfolioFederalTypeValue}</a>`;

    }

    /**
     * Asynchronously updates portfolio fields in the UI based on the selected portfolio.
     *
     * This function first checks if the page is loading or if a portfolio selection is available
     * in the `portfolioDropdown`. If a portfolio is selected, it retrieves the portfolio data,
     * then updates the UI fields to display relevant data. If no portfolio is selected, it simply 
     * refreshes the UI field display without new data. The `isPageLoading` flag prevents
     * updates during page load.
     *
     * Workflow:
     * 1. **Check Page Loading**:
     *    - If `isPageLoading` is `true`, set it to `false` and exit to prevent redundant updates.
     *    - If `isPageLoading` is `false`, proceed with portfolio field updates.
     * 
     * 2. **Portfolio Selection**:
     *    - If a portfolio is selected (`portfolioDropdown.val()`), fetch the portfolio data.
     *    - Once data is fetched, run three update functions:
     *      - `updatePortfolioFieldsData`: Populates specific portfolio-related fields.
     *      - `updatePortfolioFieldsDisplay`: Handles the visibility of general portfolio fields.
     *      - `updatePortfolioFieldsDataDynamicDisplay`: Manages conditional display based on portfolio data.
     *    - If no portfolio is selected, only refreshes the field display using `updatePortfolioFieldsDisplay`.
     *
     * Dependencies:
     * - Expects global elements (`portfolioDropdown`, etc.) and `isPageLoading` flag to be defined.
     * - Assumes `getPortfolio`, `updatePortfolioFieldsData`, `updatePortfolioFieldsDisplay`, and `updatePortfolioFieldsDataDynamicDisplay` are available as functions.
     */
    async function updatePortfolioFields() {
        if (!isPageLoading) {
            if (portfolioDropdown.val()) {
                getPortfolio(portfolioDropdown.val()).then((portfolio) => {
                    updatePortfolioFieldsData(portfolio);
                    updatePortfolioFieldsDisplay();
                    updatePortfolioFieldsDataDynamicDisplay();
                });
            } else {
                updatePortfolioFieldsDisplay();
            }
        } else {
            isPageLoading = false;
        }
    }

    /**
     * Updates the Suborganization Dropdown with new data based on the provided portfolio ID.
     *
     * This function uses the Select2 jQuery plugin to update the dropdown by fetching suborganization
     * data relevant to the selected portfolio. Upon invocation, it checks if Select2 is already initialized
     * on `suborganizationDropdown` and destroys the existing instance to avoid duplication.
     * It then reinitializes Select2 with customized options for an AJAX request, allowing the user to search
     * and select suborganizations dynamically, with results filtered based on `portfolio_id`.
     *
     * Key workflow:
     * 1. **Document Ready**: Ensures that the function runs only once the DOM is fully loaded.
     * 2. **Check and Reinitialize Select2**:
     *    - If Select2 is already initialized, it’s destroyed to refresh with new options.
     *    - Select2 is reinitialized with AJAX settings for dynamic data fetching.
     * 3. **AJAX Options**:
     *    - **Data Function**: Prepares the query by capturing the user's search term (`params.term`)
     *      and the provided `portfolio_id` to filter relevant suborganizations.
     *    - **Data Type**: Ensures responses are returned as JSON.
     *    - **Delay**: Introduces a 250ms delay to prevent excessive requests on fast typing.
     *    - **Cache**: Enables caching to improve performance.
     * 4. **Theme and Placeholder**:
     *    - Sets the dropdown theme to ‘admin-autocomplete’ for consistent styling.
     *    - Allows clearing of the dropdown and displays a placeholder as defined in the HTML.
     *
     * Dependencies:
     * - Requires `suborganizationDropdown` element, the jQuery library, and the Select2 plugin.
     * - `portfolio_id` is passed to filter results relevant to a specific portfolio.
     */
    function updateSubOrganizationDropdown(portfolio_id) {
        django.jQuery(document).ready(function() {
            if (suborganizationDropdown.data('select2')) {
                suborganizationDropdown.select2('destroy');
            }
            // Reinitialize Select2 with the updated URL
            suborganizationDropdown.select2({
                ajax: {
                    data: function (params) {
                        var query = {
                            search: params.term,
                            portfolio_id: portfolio_id
                        }
                        return query;
                    },
                    dataType: 'json',
                    delay: 250,
                    cache: true
                },
                theme: 'admin-autocomplete',
                allowClear: true,
                placeholder: suborganizationDropdown.attr('data-placeholder')
            });
        });
    }

    /**
     * Updates the display of portfolio-related fields based on whether a portfolio is selected.
     *
     * This function controls the visibility of specific fields by showing or hiding them
     * depending on the presence of a selected portfolio ID in the dropdown. When a portfolio
     * is selected, certain fields are shown (like suborganizations and portfolio-related fields),
     * while others are hidden (like senior official and other employee-related fields).
     *
     * Workflow:
     * 1. **Retrieve Portfolio ID**: 
     *    - Fetches the selected value from `portfolioDropdown` to check if a portfolio is selected.
     *
     * 2. **Display Fields for Selected Portfolio**:
     *    - If a `portfolio_id` exists, it updates the `suborganizationDropdown` for the specific portfolio.
     *    - Shows or hides various fields to display only relevant portfolio information:
     *      - Shows `suborganizationField`, `portfolioSeniorOfficialField`, and fields related to the portfolio organization.
     *      - Hides fields that are not applicable when a portfolio is selected, such as `seniorOfficialField` and `otherEmployeesField`.
     *
     * 3. **Display Fields for No Portfolio Selected**:
     *    - If no portfolio is selected (i.e., `portfolio_id` is falsy), it reverses the visibility:
     *      - Hides `suborganizationField` and other portfolio-specific fields.
     *      - Shows fields that are applicable when no portfolio is selected, such as the `seniorOfficialField`.
     *
     * Dependencies:
     * - `portfolioDropdown` is assumed to be a dropdown element containing portfolio IDs.
     * - `showElement` and `hideElement` utility functions are used to control element visibility.
     * - Various global field elements (e.g., `suborganizationField`, `seniorOfficialField`, `portfolioOrgTypeFieldSet`) are used.
     */
    function updatePortfolioFieldsDisplay() {
        // Retrieve the selected portfolio ID
        let portfolio_id = portfolioDropdown.val();

        if (portfolio_id) {
            // A portfolio is selected - update suborganization dropdown and show/hide relevant fields

            // Update suborganization dropdown for the selected portfolio
            updateSubOrganizationDropdown(portfolio_id);

            // Show fields relevant to a selected portfolio
            showElement(suborganizationField);
            hideElement(seniorOfficialField);
            showElement(portfolioSeniorOfficialField);

            // Hide fields not applicable when a portfolio is selected
            hideElement(otherEmployeesField);
            hideElement(noOtherContactsRationaleField);
            hideElement(cisaRepresentativeFirstNameField);
            hideElement(cisaRepresentativeLastNameField);
            hideElement(cisaRepresentativeEmailField);
            hideElement(orgTypeFieldSet);
            hideElement(orgTypeFieldSetDetails);
            hideElement(orgNameFieldSet);
            hideElement(orgNameFieldSetDetails);

            // Show portfolio-specific fields
            showElement(portfolioOrgTypeFieldSet);
            showElement(portfolioOrgNameFieldSet);
            showElement(portfolioOrgNameFieldSetDetails);
        } else {
            // No portfolio is selected - reverse visibility of fields

            // Hide suborganization field as no portfolio is selected
            hideElement(suborganizationField);

            // Show fields that are relevant when no portfolio is selected
            showElement(seniorOfficialField);
            hideElement(portfolioSeniorOfficialField);
            showElement(otherEmployeesField);
            showElement(noOtherContactsRationaleField);
            showElement(cisaRepresentativeFirstNameField);
            showElement(cisaRepresentativeLastNameField);
            showElement(cisaRepresentativeEmailField);

            // Show organization type and name fields
            showElement(orgTypeFieldSet);
            showElement(orgTypeFieldSetDetails);
            showElement(orgNameFieldSet);
            showElement(orgNameFieldSetDetails);

            // Hide portfolio-specific fields that aren’t applicable
            hideElement(portfolioOrgTypeFieldSet);
            hideElement(portfolioOrgNameFieldSet);
            hideElement(portfolioOrgNameFieldSetDetails);
        }

        updateSuborganizationFieldsDisplay();

    }

    /**
     * Updates the visibility of suborganization-related fields based on the selected value in the suborganization dropdown.
     * 
     * If a suborganization is selected:
     *   - Hides the fields related to requesting a new suborganization (`requestedSuborganizationField`).
     *   - Hides the city (`suborganizationCity`) and state/territory (`suborganizationStateTerritory`) fields for the suborganization.
     * 
     * If no suborganization is selected:
     *   - Shows the fields for requesting a new suborganization (`requestedSuborganizationField`).
     *   - Displays the city (`suborganizationCity`) and state/territory (`suborganizationStateTerritory`) fields.
     * 
     * This function ensures the form dynamically reflects whether a specific suborganization is being selected or requested.
     */
    function updateSuborganizationFieldsDisplay() {
        let portfolio_id = portfolioDropdown.val();
        let suborganization_id = suborganizationDropdown.val();

        if (portfolio_id && !suborganization_id) {
            // Show suborganization request fields
            showElement(requestedSuborganizationField);
            showElement(suborganizationCity);
            showElement(suborganizationStateTerritory);
        } else {
            // Hide suborganization request fields if suborganization is selected
            hideElement(requestedSuborganizationField);
            hideElement(suborganizationCity);
            hideElement(suborganizationStateTerritory);  
        }
    }

    /**
     * Initializes necessary data and display configurations for the portfolio fields.
     */
    function initializePortfolioSettings() {
        // Update the visibility of portfolio-related fields based on current dropdown selection.
        updatePortfolioFieldsDisplay();

        // Dynamically adjust the display of certain fields based on the selected portfolio's characteristics.
        updatePortfolioFieldsDataDynamicDisplay();
    }

    /**
     * Sets event listeners for key UI elements.
     */
    function setEventListeners() {
        // When the `portfolioDropdown` selection changes, refresh the displayed portfolio fields.
        portfolioDropdown.on("change", updatePortfolioFields);
        // When the 'suborganizationDropdown' selection changes
        suborganizationDropdown.on("change", updateSuborganizationFieldsDisplay);
    }

    // Run initial setup functions
    initializePortfolioSettings();
    setEventListeners();
}

// <<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>><<>>
// Initialization code.


/** An IIFE for pages in DjangoAdmin that use modals.
 * Dja strips out form elements, and modals generate their content outside
 * of the current form scope, so we need to "inject" these inputs.
*/
(function (){
    function createPhantomModalFormButtons(){
        let submitButtons = document.querySelectorAll('.usa-modal button[type="submit"].dja-form-placeholder');
        form = document.querySelector("form")
        submitButtons.forEach((button) => {

            let input = document.createElement("input");
            input.type = "submit";

            if(button.name){
                input.name = button.name;
            }

            if(button.value){
                input.value = button.value;
            }

            input.style.display = "none"

            // Add the hidden input to the form
            form.appendChild(input);
            button.addEventListener("click", () => {
                input.click();
            })
        })
    }

    createPhantomModalFormButtons();
})();


/** An IIFE for DomainRequest to hook a modal to a dropdown option.
 * This intentionally does not interact with createPhantomModalFormButtons()
*/
(function (){
    function displayModalOnDropdownClick(linkClickedDisplaysModal, statusDropdown, actionButton, valueToCheck){

        // If these exist all at the same time, we're on the right page
        if (linkClickedDisplaysModal && statusDropdown && statusDropdown.value){
            
            // Set the previous value in the event the user cancels.
            let previousValue = statusDropdown.value;
            if (actionButton){

                // Otherwise, if the confirmation buttion is pressed, set it to that
                actionButton.addEventListener('click', function() {
                    // Revert the dropdown to its previous value
                    statusDropdown.value = valueToCheck;
                });
            }else {
                console.log("displayModalOnDropdownClick() -> Cancel button was null")
            }

            // Add a change event listener to the dropdown.
            statusDropdown.addEventListener('change', function() {
                // Check if "Ineligible" is selected
                if (this.value && this.value.toLowerCase() === valueToCheck) {
                    // Set the old value in the event the user cancels,
                    // or otherwise exists the dropdown.
                    statusDropdown.value = previousValue

                    // Display the modal.
                    linkClickedDisplaysModal.click()
                }
            });
        }
    }

    // When the status dropdown is clicked and is set to "ineligible", toggle a confirmation dropdown.
    function hookModalToIneligibleStatus(){
        // Grab the invisible element that will hook to the modal.
        // This doesn't technically need to be done with one, but this is simpler to manage.
        let modalButton = document.getElementById("invisible-ineligible-modal-toggler")
        let statusDropdown = document.getElementById("id_status")

        // Because the modal button does not have the class "dja-form-placeholder",
        // it will not be affected by the createPhantomModalFormButtons() function.
        let actionButton = document.querySelector('button[name="_set_domain_request_ineligible"]');
        let valueToCheck = "ineligible"
        displayModalOnDropdownClick(modalButton, statusDropdown, actionButton, valueToCheck);
    }

    hookModalToIneligibleStatus()
})();

/** An IIFE for pages in DjangoAdmin which may need custom JS implementation.
 * Currently only appends target="_blank" to the domain_form object,
 * but this can be expanded.
*/
(function (){
    /*
    On mouseover, appends target="_blank" on domain_form under the Domain page.
    The reason for this is that the template has a form that contains multiple buttons.
    The structure of that template complicates seperating those buttons 
    out of the form (while maintaining the same position on the page).
    However, if we want to open one of those submit actions to a new tab - 
    such as the manage domain button - we need to dynamically append target.
    As there is no built-in django method which handles this, we do it here. 
    */
    function prepareDjangoAdmin() {
        let domainFormElement = document.getElementById("domain_form");
        let domainSubmitButton = document.getElementById("manageDomainSubmitButton");
        if(domainSubmitButton && domainFormElement){
            domainSubmitButton.addEventListener("mouseover", () => openInNewTab(domainFormElement, true));
            domainSubmitButton.addEventListener("mouseout", () => openInNewTab(domainFormElement, false));
        }
    }

    prepareDjangoAdmin();
})();


/** An IIFE for the "Assign to me" button under the investigator field in DomainRequests.
** This field uses the "select2" selector, rather than the default. 
** To perform data operations on this - we need to use jQuery rather than vanilla js. 
*/
(function (){
    if (document.getElementById("id_investigator") && django && django.jQuery) {
        let selector = django.jQuery("#id_investigator")
        let assignSelfButton = document.querySelector("#investigator__assign_self");
        if (!selector || !assignSelfButton) {
            return;
        }

        let currentUserId = assignSelfButton.getAttribute("data-user-id");
        let currentUserName = assignSelfButton.getAttribute("data-user-name");
        if (!currentUserId || !currentUserName){
            console.error("Could not assign current user: no values found.")
            return;
        }

        // Hook a click listener to the "Assign to me" button.
        // Logic borrowed from here: https://select2.org/programmatic-control/add-select-clear-items#create-if-not-exists
        assignSelfButton.addEventListener("click", function() {
            if (selector.find(`option[value='${currentUserId}']`).length) {
                // Select the value that is associated with the current user.
                selector.val(currentUserId).trigger("change");
            } else { 
                // Create a DOM Option that matches the desired user. Then append it and select it.
                let userOption = new Option(currentUserName, currentUserId, true, true);
                selector.append(userOption).trigger("change");
            }
        });

        // Listen to any change events, and hide the parent container if investigator has a value.
        selector.on('change', function() {
            // The parent container has display type flex.
            assignSelfButton.parentElement.style.display = this.value === currentUserId ? "none" : "flex";
        });
    }
})();

/** An IIFE for pages in DjangoAdmin that use a clipboard button
*/
(function (){

    function copyToClipboardAndChangeIcon(button) {
        // Assuming the input is the previous sibling of the button
        let input = button.previousElementSibling;
        // Copy input value to clipboard
        if (input) {
            navigator.clipboard.writeText(input.value).then(function() {
                // Change the icon to a checkmark on successful copy
                let buttonIcon = button.querySelector('.copy-to-clipboard use');
                if (buttonIcon) {
                    let currentHref = buttonIcon.getAttribute('xlink:href');
                    let baseHref = currentHref.split('#')[0];

                    // Append the new icon reference
                    buttonIcon.setAttribute('xlink:href', baseHref + '#check');

                    // Change the button text
                    let nearestSpan = button.querySelector("span")
                    let original_text = nearestSpan.innerText
                    nearestSpan.innerText = "Copied to clipboard"

                    setTimeout(function() {
                        // Change back to the copy icon
                        buttonIcon.setAttribute('xlink:href', currentHref); 
                        nearestSpan.innerText = original_text;
                    }, 2000);

                }
            }).catch(function(error) {
                console.error('Clipboard copy failed', error);
            });
        }
    }
    
    function handleClipboardButtons() {
        clipboardButtons = document.querySelectorAll(".copy-to-clipboard")
        clipboardButtons.forEach((button) => {

            // Handle copying the text to your clipboard,
            // and changing the icon.
            button.addEventListener("click", ()=>{
                copyToClipboardAndChangeIcon(button);
            });
            
            // Add a class that adds the outline style on click
            button.addEventListener("mousedown", function() {
                this.classList.add("no-outline-on-click");
            });
            
            // But add it back in after the user clicked,
            // for accessibility reasons (so we can still tab, etc)
            button.addEventListener("blur", function() {
                this.classList.remove("no-outline-on-click");
            });

        });
    }

    handleClipboardButtons();
})();


/**
 * An IIFE to listen to changes on filter_horizontal and enable or disable the change/delete/view buttons as applicable
 *
 */
(function extendFilterHorizontalWidgets() {
    // Initialize custom filter_horizontal widgets; each widget has a "from" select list
    // and a "to" select list; initialization is based off of the presence of the
    // "to" select list
    checkToListThenInitWidget('id_groups_to', 0);
    checkToListThenInitWidget('id_user_permissions_to', 0);
    checkToListThenInitWidget('id_portfolio_roles_to', 0);
    checkToListThenInitWidget('id_portfolio_additional_permissions_to', 0);
})();

// Function to check for the existence of the "to" select list element in the DOM, and if and when found,
// initialize the associated widget
function checkToListThenInitWidget(toListId, attempts) {
    let toList = document.getElementById(toListId);
    attempts++;

    if (attempts < 12) {
        if (toList) {
            // toList found, handle it
            // Then get fromList and handle it
            initializeWidgetOnList(toList, ".selector-chosen");
            let fromList = toList.closest('.selector').querySelector(".selector-available select");
            initializeWidgetOnList(fromList, ".selector-available");
        } else {
            // Element not found, check again after a delay
            setTimeout(() => checkToListThenInitWidget(toListId, attempts), 300); // Check every 300 milliseconds
        }
    }
}

// Initialize the widget:
// Replace h2 with more semantic h3
function initializeWidgetOnList(list, parentId) {    
    if (list) {
        // Get h2 and its container
        const parentElement = list.closest(parentId);
        const h2Element = parentElement.querySelector('h2');

        // One last check
        if (parentElement && h2Element) {
            // Create a new <h3> element
            const h3Element = document.createElement('h3');

            // Copy the text content from the <h2> element to the <h3> element
            h3Element.textContent = h2Element.textContent;

            // Find the nested <span> element inside the <h2>
            const nestedSpan = h2Element.querySelector('span[class][title]');

            // If the nested <span> element exists
            if (nestedSpan) {
                // Create a new <span> element
                const newSpan = document.createElement('span');

                // Copy the class and title attributes from the nested <span> element
                newSpan.className = nestedSpan.className;
                newSpan.title = nestedSpan.title;

                // Append the new <span> element to the <h3> element
                h3Element.appendChild(newSpan);
            }

            // Replace the <h2> element with the new <h3> element
            parentElement.replaceChild(h3Element, h2Element);
        }
    }
}


/** An IIFE for toggling the submit bar on domain request forms
*/
(function (){
    // Get a reference to the button element
    const toggleButton = document.getElementById('submitRowToggle');
    const submitRowWrapper = document.querySelector('.submit-row-wrapper');

    if (toggleButton) {
        // Add event listener to toggle the class and update content on click
        toggleButton.addEventListener('click', function() {
            // Toggle the 'collapsed' class on the bar
            submitRowWrapper.classList.toggle('submit-row-wrapper--collapsed');

            // Get a reference to the span element inside the button
            const spanElement = this.querySelector('span');

            // Get a reference to the use element inside the button
            const useElement = this.querySelector('use');

            // Check if the span element text is 'Hide'
            if (spanElement.textContent.trim() === 'Hide') {
                // Update the span element text to 'Show'
                spanElement.textContent = 'Show';

                // Update the xlink:href attribute to expand_more
                useElement.setAttribute('xlink:href', '/public/img/sprite.svg#expand_less');
            } else {
                // Update the span element text to 'Hide'
                spanElement.textContent = 'Hide';

                // Update the xlink:href attribute to expand_less
                useElement.setAttribute('xlink:href', '/public/img/sprite.svg#expand_more');
            }
        });

        // We have a scroll indicator at the end of the page.
        // Observe it. Once it gets on screen, test to see if the row is collapsed.
        // If it is, expand it.
        const targetElement = document.querySelector(".scroll-indicator");
        const options = {
            threshold: 1
        };
        // Create a new Intersection Observer
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Refresh reference to submit row wrapper and check if it's collapsed
                    if (document.querySelector('.submit-row-wrapper').classList.contains('submit-row-wrapper--collapsed')) {
                        toggleButton.click();
                    }
                }
            });
        }, options);
        observer.observe(targetElement);
    }
})();

/** An IIFE for toggling the overflow styles on django-admin__model-description (the show more / show less button) */
(function () {
    function handleShowMoreButton(toggleButton, descriptionDiv){
        // Check the length of the text content in the description div
        if (descriptionDiv.textContent.length < 200) {
            // Hide the toggle button if text content is less than 200 characters
            // This is a little over 160 characters to give us some wiggle room if we
            // change the font size marginally.
            toggleButton.classList.add('display-none');
        } else {
            toggleButton.addEventListener('click', function() {
                toggleShowMoreButton(toggleButton, descriptionDiv, 'dja__model-description--no-overflow')
            });
        }
    }

    function toggleShowMoreButton(toggleButton, descriptionDiv, showMoreClassName){
        // Toggle the class on the description div
        descriptionDiv.classList.toggle(showMoreClassName);

        // Change the button text based on the presence of the class
        if (descriptionDiv.classList.contains(showMoreClassName)) {
            toggleButton.textContent = 'Show less';
        } else {    
            toggleButton.textContent = 'Show more';
        }
    }

    let toggleButton = document.getElementById('dja-show-more-model-description');
    let descriptionDiv = document.querySelector('.dja__model-description');
    if (toggleButton && descriptionDiv) {
        handleShowMoreButton(toggleButton, descriptionDiv)
    }
})();


class CustomizableEmailBase {

    /**
     * @param {Object} config - must contain the following:
     * @property {HTMLElement} dropdown - The dropdown element.
     * @property {HTMLElement} textarea - The textarea element.
     * @property {HTMLElement} lastSentEmailContent - The last sent email content element.
     * @property {HTMLElement} textAreaFormGroup - The form group for the textarea.
     * @property {HTMLElement} dropdownFormGroup - The form group for the dropdown.
     * @property {HTMLElement} modalConfirm - The confirm button in the modal.
     * @property {string} apiUrl - The API URL for fetching email content.
     * @property {string} statusToCheck - The status to check against. Used for show/hide on textAreaFormGroup/dropdownFormGroup.
     * @property {string} sessionVariableName - The session variable name. Used for show/hide on textAreaFormGroup/dropdownFormGroup.
     * @property {string} apiErrorMessage - The error message that the ajax call returns.
     */
    constructor(config) {
        this.config = config;        
        this.dropdown = config.dropdown;
        this.textarea = config.textarea;
        this.lastSentEmailContent = config.lastSentEmailContent;
        this.apiUrl = config.apiUrl;
        this.apiErrorMessage = config.apiErrorMessage;
        this.modalConfirm = config.modalConfirm;

        // These fields are hidden/shown on pageload depending on the current status
        this.textAreaFormGroup = config.textAreaFormGroup;
        this.dropdownFormGroup = config.dropdownFormGroup;
        this.statusToCheck = config.statusToCheck;
        this.sessionVariableName = config.sessionVariableName;

        // Non-configurable variables
        this.statusSelect = document.getElementById("id_status");
        this.domainRequestId = this.dropdown ? document.getElementById("domain_request_id").value : null
        this.initialDropdownValue = this.dropdown ? this.dropdown.value : null;
        this.initialEmailValue = this.textarea ? this.textarea.value : null;

        // Find other fields near the textarea 
        const parentDiv = this.textarea ? this.textarea.closest(".flex-container") : null;
        this.directEditButton = parentDiv ? parentDiv.querySelector(".edit-email-button") : null;
        this.modalTrigger = parentDiv ? parentDiv.querySelector(".edit-button-modal-trigger") : null;

        this.textareaPlaceholder = parentDiv ? parentDiv.querySelector(".custom-email-placeholder") : null;
        this.formLabel = this.textarea ? document.querySelector(`label[for="${this.textarea.id}"]`) : null;

        this.isEmailAlreadySentConst;
        if (this.lastSentEmailContent && this.textarea) {
            this.isEmailAlreadySentConst = this.lastSentEmailContent.value.replace(/\s+/g, '') === this.textarea.value.replace(/\s+/g, '');
        }

    }

    // Handle showing/hiding the related fields on page load.
    initializeFormGroups() {
        let isStatus = this.statusSelect.value == this.statusToCheck;

        // Initial handling of these groups.
        this.updateFormGroupVisibility(isStatus);

        // Listen to change events and handle rejectionReasonFormGroup display, then save status to session storage
        this.statusSelect.addEventListener('change', () => {
            // Show the action needed field if the status is what we expect.
            // Then track if its shown or hidden in our session cache.
            isStatus = this.statusSelect.value == this.statusToCheck;
            this.updateFormGroupVisibility(isStatus);
            addOrRemoveSessionBoolean(this.sessionVariableName, isStatus);
        });
        
        // Listen to Back/Forward button navigation and handle rejectionReasonFormGroup display based on session storage
        // When you navigate using forward/back after changing status but not saving, when you land back on the DA page the
        // status select will say (for example) Rejected but the selected option can be something else. To manage the show/hide
        // accurately for this edge case, we use cache and test for the back/forward navigation.
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.type === "back_forward") {
                    let showTextAreaFormGroup = sessionStorage.getItem(this.sessionVariableName) !== null;
                    this.updateFormGroupVisibility(showTextAreaFormGroup);
                }
            });
        });
        observer.observe({ type: "navigation" });
    }

    updateFormGroupVisibility(showFormGroups) {
        if (showFormGroups) {
            showElement(this.textAreaFormGroup);
            showElement(this.dropdownFormGroup);
        }else {
            hideElement(this.textAreaFormGroup);
            hideElement(this.dropdownFormGroup);
        }
    }

    initializeDropdown() {
        this.dropdown.addEventListener("change", () => {
            let reason = this.dropdown.value;
            if (this.initialDropdownValue !== this.dropdown.value || this.initialEmailValue !== this.textarea.value) {
                let searchParams = new URLSearchParams(
                    {
                        "reason": reason,
                        "domain_request_id": this.domainRequestId,
                    }
                );
                // Replace the email content
                fetch(`${this.apiUrl}?${searchParams.toString()}`)
                .then(response => {
                    return response.json().then(data => data);
                })
                .then(data => {
                    if (data.error) {
                        console.error("Error in AJAX call: " + data.error);
                    }else {
                        this.textarea.value = data.email;
                    }
                    this.updateUserInterface(reason);
                })
                .catch(error => {
                    console.error(this.apiErrorMessage, error)
                });
            }
        });
    }

    initializeModalConfirm() {
        this.modalConfirm.addEventListener("click", () => {
            this.textarea.removeAttribute('readonly');
            this.textarea.focus();
            hideElement(this.directEditButton);
            hideElement(this.modalTrigger);  
        });
    }

    initializeDirectEditButton() {
        this.directEditButton.addEventListener("click", () => {
            this.textarea.removeAttribute('readonly');
            this.textarea.focus();
            hideElement(this.directEditButton);
            hideElement(this.modalTrigger);  
        });
    }

    isEmailAlreadySent() {
        return this.lastSentEmailContent.value.replace(/\s+/g, '') === this.textarea.value.replace(/\s+/g, '');
    }

    updateUserInterface(reason=this.dropdown.value, excluded_reasons=["other"]) {
        if (!reason) {
            // No reason selected, we will set the label to "Email", show the "Make a selection" placeholder, hide the trigger, textarea, hide the help text
            this.showPlaceholderNoReason();
        } else if (excluded_reasons.includes(reason)) {
            // 'Other' selected, we will set the label to "Email", show the "No email will be sent" placeholder, hide the trigger, textarea, hide the help text
            this.showPlaceholderOtherReason();
        } else {
            this.showReadonlyTextarea();
        }
    }

    // Helper function that makes overriding the readonly textarea easy
    showReadonlyTextarea() {
        // A triggering selection is selected, all hands on board:
        this.textarea.setAttribute('readonly', true);
        showElement(this.textarea);
        hideElement(this.textareaPlaceholder);

        if (this.isEmailAlreadySentConst) {
            hideElement(this.directEditButton);
            showElement(this.modalTrigger);
        } else {
            showElement(this.directEditButton);
            hideElement(this.modalTrigger);
        }

        if (this.isEmailAlreadySent()) {
            this.formLabel.innerHTML = "Email sent to creator:";
        } else {
            this.formLabel.innerHTML = "Email:";
        }
    }

    // Helper function that makes overriding the placeholder reason easy
    showPlaceholderNoReason() {
        this.showPlaceholder("Email:", "Select a reason to see email");
    }

    // Helper function that makes overriding the placeholder reason easy
    showPlaceholderOtherReason() {
        this.showPlaceholder("Email:", "No email will be sent");
    }

    showPlaceholder(formLabelText, placeholderText) {
        this.formLabel.innerHTML = formLabelText;
        this.textareaPlaceholder.innerHTML = placeholderText;
        showElement(this.textareaPlaceholder);
        hideElement(this.directEditButton);
        hideElement(this.modalTrigger);
        hideElement(this.textarea);
    }
}



class customActionNeededEmail extends CustomizableEmailBase {
    constructor() {
        const emailConfig = {
            dropdown: document.getElementById("id_action_needed_reason"),
            textarea: document.getElementById("id_action_needed_reason_email"),
            lastSentEmailContent: document.getElementById("last-sent-action-needed-email-content"),
            modalConfirm: document.getElementById("action-needed-reason__confirm-edit-email"),
            apiUrl: document.getElementById("get-action-needed-email-for-user-json")?.value || null,
            textAreaFormGroup: document.querySelector('.field-action_needed_reason'),
            dropdownFormGroup: document.querySelector('.field-action_needed_reason_email'),
            statusToCheck: "action needed",
            sessionVariableName: "showActionNeededReason",
            apiErrorMessage: "Error when attempting to grab action needed email: "
        }
        super(emailConfig);
    }

    loadActionNeededEmail() {
        // Hide/show the email fields depending on the current status
        this.initializeFormGroups();
        // Setup the textarea, edit button, helper text
        this.updateUserInterface();
        this.initializeDropdown();
        this.initializeModalConfirm();
        this.initializeDirectEditButton();
    }

    // Overrides the placeholder text when no reason is selected
    showPlaceholderNoReason() {
        this.showPlaceholder("Email:", "Select an action needed reason to see email");
    }

    // Overrides the placeholder text when the reason other is selected
    showPlaceholderOtherReason() {
        this.showPlaceholder("Email:", "No email will be sent");
    }
}

/** An IIFE that hooks to the show/hide button underneath action needed reason.
 * This shows the auto generated email on action needed reason.
*/
document.addEventListener('DOMContentLoaded', function() {
    const domainRequestForm = document.getElementById("domainrequest_form");
    if (!domainRequestForm) {
        return;
    }

    // Initialize UI
    const customEmail = new customActionNeededEmail();

    // Check that every variable was setup correctly
    const nullItems = Object.entries(customEmail.config).filter(([key, value]) => value === null).map(([key]) => key);
    if (nullItems.length > 0) {
        console.error(`Failed to load customActionNeededEmail(). Some variables were null: ${nullItems.join(", ")}`)
        return;
    }
    customEmail.loadActionNeededEmail()
});


class customRejectedEmail extends CustomizableEmailBase {
    constructor() {
        const emailConfig = {
            dropdown: document.getElementById("id_rejection_reason"),
            textarea: document.getElementById("id_rejection_reason_email"),
            lastSentEmailContent: document.getElementById("last-sent-rejection-email-content"),
            modalConfirm: document.getElementById("rejection-reason__confirm-edit-email"),
            apiUrl: document.getElementById("get-rejection-email-for-user-json")?.value || null,
            textAreaFormGroup: document.querySelector('.field-rejection_reason'),
            dropdownFormGroup: document.querySelector('.field-rejection_reason_email'),
            statusToCheck: "rejected",
            sessionVariableName: "showRejectionReason",
            errorMessage: "Error when attempting to grab rejected email: "
        };
        super(emailConfig);
    }

    loadRejectedEmail() {
        this.initializeFormGroups();
        this.updateUserInterface();
        this.initializeDropdown();
        this.initializeModalConfirm();
        this.initializeDirectEditButton();
    }

    // Overrides the placeholder text when no reason is selected
    showPlaceholderNoReason() {
        this.showPlaceholder("Email:", "Select a rejection reason to see email");
    }

    updateUserInterface(reason=this.dropdown.value, excluded_reasons=[]) {
        super.updateUserInterface(reason, excluded_reasons);
    }
    // Overrides the placeholder text when the reason other is selected
    // showPlaceholderOtherReason() {
    //     this.showPlaceholder("Email:", "No email will be sent");
    // }
}


/** An IIFE that hooks to the show/hide button underneath rejected reason.
 * This shows the auto generated email on action needed reason.
*/
document.addEventListener('DOMContentLoaded', function() {
    const domainRequestForm = document.getElementById("domainrequest_form");
    if (!domainRequestForm) {
        return;
    }

    // Initialize UI
    const customEmail = new customRejectedEmail();
    // Check that every variable was setup correctly
    const nullItems = Object.entries(customEmail.config).filter(([key, value]) => value === null).map(([key]) => key);
    if (nullItems.length > 0) {
        console.error(`Failed to load customRejectedEmail(). Some variables were null: ${nullItems.join(", ")}`)
        return;
    }
    customEmail.loadRejectedEmail()
});

/** An IIFE that hides and shows approved domain select2 row in domain request
 * conditionally based on the Status field selection. If Approved, show. If not Approved,
 * don't show.
 */
document.addEventListener('DOMContentLoaded', function() {
    const domainRequestForm = document.getElementById("domainrequest_form");
    if (!domainRequestForm) {
        return;
    }

    const statusToCheck = "approved";
    const statusSelect = document.getElementById("id_status");
    const sessionVariableName = "showApprovedDomain";
    let approvedDomainFormGroup = document.querySelector(".field-approved_domain");

    function updateFormGroupVisibility(showFormGroups) {
        if (showFormGroups) {
            showElement(approvedDomainFormGroup);
        }else {
            hideElement(approvedDomainFormGroup);
        }
    }

    // Handle showing/hiding the related fields on page load.
    function initializeFormGroups() {
        let isStatus = statusSelect.value == statusToCheck;

        // Initial handling of these groups.
        updateFormGroupVisibility(isStatus);

        // Listen to change events and handle rejectionReasonFormGroup display, then save status to session storage
        statusSelect.addEventListener('change', () => {
            // Show the approved if the status is what we expect.
            isStatus = statusSelect.value == statusToCheck;
            updateFormGroupVisibility(isStatus);
            addOrRemoveSessionBoolean(sessionVariableName, isStatus);
        });
        
        // Listen to Back/Forward button navigation and handle approvedDomainFormGroup display based on session storage
        // When you navigate using forward/back after changing status but not saving, when you land back on the DA page the
        // status select will say (for example) Rejected but the selected option can be something else. To manage the show/hide
        // accurately for this edge case, we use cache and test for the back/forward navigation.
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.type === "back_forward") {
                    let showTextAreaFormGroup = sessionStorage.getItem(sessionVariableName) !== null;
                    updateFormGroupVisibility(showTextAreaFormGroup);
                }
            });
        });
        observer.observe({ type: "navigation" });
    }

    initializeFormGroups();

});


/** An IIFE for copy summary button (appears in DomainRegistry models)
*/
(function (){
    const copyButton = document.getElementById('id-copy-to-clipboard-summary');

    if (copyButton) {
        copyButton.addEventListener('click', function() {
            /// Generate a rich HTML summary text and copy to clipboard

            //------ Organization Type
            const organizationTypeElement = document.getElementById('id_organization_type');
            const organizationType = organizationTypeElement.options[organizationTypeElement.selectedIndex].text;

            //------ Alternative Domains
            const alternativeDomainsDiv = document.querySelector('.form-row.field-alternative_domains .readonly');
            const alternativeDomainslinks = alternativeDomainsDiv.querySelectorAll('a');
            const alternativeDomains = Array.from(alternativeDomainslinks).map(link => link.textContent);

            //------ Existing Websites
            const existingWebsitesDiv = document.querySelector('.form-row.field-current_websites .readonly');
            const existingWebsiteslinks = existingWebsitesDiv.querySelectorAll('a');
            const existingWebsites = Array.from(existingWebsiteslinks).map(link => link.textContent);

            //------ Additional Contacts
            // 1 - Create a hyperlinks map so we can display contact details and also link to the contact
            const otherContactsDiv = document.querySelector('.form-row.field-other_contacts .readonly');
            let otherContactLinks = [];
            const nameToUrlMap = {};
            if (otherContactsDiv) {
                otherContactLinks = otherContactsDiv.querySelectorAll('a');
                otherContactLinks.forEach(link => {
                const name = link.textContent.trim();
                const url = link.href;
                nameToUrlMap[name] = url;
                });
            }
        
            // 2 - Iterate through contact details and assemble html for summary
            let otherContactsSummary = ""
            const bulletList = document.createElement('ul');

            // CASE 1 - Contacts are not in a table (this happens if there is only one or two other contacts)
            const contacts = document.querySelectorAll('.field-other_contacts .dja-detail-list dd');
            if (contacts) {
                contacts.forEach(contact => {
                    // Check if the <dl> element is not empty
                    const name = contact.querySelector('a.contact_info_name')?.innerText;
                    const title = contact.querySelector('span.contact_info_title')?.innerText;
                    const email = contact.querySelector('span.contact_info_email')?.innerText;
                    const phone = contact.querySelector('span.contact_info_phone')?.innerText;
                    const url = nameToUrlMap[name] || '#';
                    // Format the contact information
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<a href="${url}">${name}</a>, ${title}, ${email}, ${phone}`;
                    bulletList.appendChild(listItem);
                });

            }

            // CASE 2 - Contacts are in a table (this happens if there is more than 2 contacts)
            const otherContactsTable = document.querySelector('.form-row.field-other_contacts table tbody');
            if (otherContactsTable) {
                const otherContactsRows = otherContactsTable.querySelectorAll('tr');
                otherContactsRows.forEach(contactRow => {
                // Extract the contact details
                const name = contactRow.querySelector('th').textContent.trim();
                const title = contactRow.querySelectorAll('td')[0].textContent.trim();
                const email = contactRow.querySelectorAll('td')[1].textContent.trim();
                const phone = contactRow.querySelectorAll('td')[2].textContent.trim();
                const url = nameToUrlMap[name] || '#';
                // Format the contact information
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="${url}">${name}</a>, ${title}, ${email}, ${phone}`;
                bulletList.appendChild(listItem);
                });
            }
            otherContactsSummary += bulletList.outerHTML


            //------ Requested Domains
            const requestedDomainElement = document.getElementById('id_requested_domain');
            // We have to account for different superuser and analyst markups
            const requestedDomain = requestedDomainElement.options 
                ? requestedDomainElement.options[requestedDomainElement.selectedIndex].text 
                : requestedDomainElement.text;

            //------ Submitter
            // Function to extract text by ID and handle missing elements
            function extractTextById(id, divElement) {
                if (divElement) {
                    const element = divElement.querySelector(`#${id}`);
                    return element ? ", " + element.textContent.trim() : '';
                }
                return '';
            }

            //------ Senior Official
            const seniorOfficialDiv = document.querySelector('.form-row.field-senior_official');
            const seniorOfficialElement = document.getElementById('id_senior_official');
            const seniorOfficialName = seniorOfficialElement.options[seniorOfficialElement.selectedIndex].text;
            const seniorOfficialTitle = seniorOfficialDiv.querySelector('.contact_info_title');
            const seniorOfficialEmail = seniorOfficialDiv.querySelector('.contact_info_email');
            const seniorOfficialPhone = seniorOfficialDiv.querySelector('.contact_info_phone');
            let seniorOfficialInfo = `${seniorOfficialName}${seniorOfficialTitle}${seniorOfficialEmail}${seniorOfficialPhone}`;

            const html_summary = `<strong>Recommendation:</strong></br>` +
                            `<strong>Organization Type:</strong> ${organizationType}</br>` +
                            `<strong>Requested Domain:</strong> ${requestedDomain}</br>` +
                            `<strong>Current Websites:</strong> ${existingWebsites.join(', ')}</br>` +
                            `<strong>Rationale:</strong></br>` +
                            `<strong>Alternative Domains:</strong> ${alternativeDomains.join(', ')}</br>` +
                            `<strong>Senior Official:</strong> ${seniorOfficialInfo}</br>` +
                            `<strong>Other Employees:</strong> ${otherContactsSummary}</br>`;
            
            //Replace </br> with \n, then strip out all remaining html tags (replace <...> with '')
            const plain_summary = html_summary.replace(/<\/br>|<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, '');

            // Create Blobs with the summary content
            const html_blob = new Blob([html_summary], { type: 'text/html' });
            const plain_blob = new Blob([plain_summary], { type: 'text/plain' });

            // Create a ClipboardItem with the Blobs
            const clipboardItem = new ClipboardItem({
                'text/html': html_blob,
                'text/plain': plain_blob
            });

            // Write the ClipboardItem to the clipboard
            navigator.clipboard.write([clipboardItem]).then(() => {
                // Change the icon to a checkmark on successful copy
                let buttonIcon = copyButton.querySelector('use');
                if (buttonIcon) {
                    let currentHref = buttonIcon.getAttribute('xlink:href');
                    let baseHref = currentHref.split('#')[0];

                    // Append the new icon reference
                    buttonIcon.setAttribute('xlink:href', baseHref + '#check');

                    // Change the button text
                    nearestSpan = copyButton.querySelector("span")
                    original_text = nearestSpan.innerText
                    nearestSpan.innerText = "Copied to clipboard"

                    setTimeout(function() {
                        // Change back to the copy icon
                        buttonIcon.setAttribute('xlink:href', currentHref); 
                        nearestSpan.innerText = original_text
                    }, 2000);

                }
                console.log('Summary copied to clipboard successfully!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }
})();


/** An IIFE for dynamically changing some fields on the portfolio admin model
 * IMPORTANT NOTE: The logic in this IIFE is paired handlePortfolioSelection
*/
(function dynamicPortfolioFields(){

    // the federal agency change listener fires on page load, which we don't want.
    var isInitialPageLoad = true

    // This is the additional information that exists beneath the SO element.
    var contactList = document.querySelector(".field-senior_official .dja-address-contact-list");
    const federalAgencyContainer = document.querySelector(".field-federal_agency");
    document.addEventListener('DOMContentLoaded', function() {

        let isPortfolioPage = document.getElementById("portfolio_form");
        if (!isPortfolioPage) {
            return;
        }

        // $ symbolically denotes that this is using jQuery
        let $federalAgency = django.jQuery("#id_federal_agency");
        let organizationType = document.getElementById("id_organization_type");
        let readonlyOrganizationType = document.querySelector(".field-organization_type .readonly");

        let organizationNameContainer = document.querySelector(".field-organization_name");
        let federalType = document.querySelector(".field-federal_type");

        if ($federalAgency && (organizationType || readonlyOrganizationType)) {
            // Attach the change event listener
            $federalAgency.on("change", function() {
                handleFederalAgencyChange($federalAgency, organizationType, readonlyOrganizationType, organizationNameContainer, federalType);
            });
        }
        
        // Handle dynamically hiding the urbanization field
        let urbanizationField = document.querySelector(".field-urbanization");
        let stateTerritory = document.getElementById("id_state_territory");
        if (urbanizationField && stateTerritory) {
            // Execute this function once on load
            handleStateTerritoryChange(stateTerritory, urbanizationField);

            // Attach the change event listener for state/territory
            stateTerritory.addEventListener("change", function() {
                handleStateTerritoryChange(stateTerritory, urbanizationField);
            });
        }

        // Handle hiding the organization name field when the organization_type is federal.
        // Run this first one page load, then secondly on a change event.
        handleOrganizationTypeChange(organizationType, organizationNameContainer, federalType);
        organizationType.addEventListener("change", function() {
            handleOrganizationTypeChange(organizationType, organizationNameContainer, federalType);
        });
    });

    function handleOrganizationTypeChange(organizationType, organizationNameContainer, federalType) {
        if (organizationType && organizationNameContainer) {
            let selectedValue = organizationType.value;
            if (selectedValue === "federal") {
                hideElement(organizationNameContainer);
                showElement(federalAgencyContainer);
                if (federalType) {
                    showElement(federalType);
                }
            } else {
                showElement(organizationNameContainer);
                hideElement(federalAgencyContainer);
                if (federalType) {
                    hideElement(federalType);
                }
            }
        }
    }

    function handleFederalAgencyChange(federalAgency, organizationType, readonlyOrganizationType, organizationNameContainer, federalType) {
        // Don't do anything on page load
        if (isInitialPageLoad) {
            isInitialPageLoad = false;
            return;
        }

        // Set the org type to federal if an agency is selected
        let selectedText = federalAgency.find("option:selected").text();

        // There isn't a federal senior official associated with null records
        if (!selectedText) {
            return;
        }

        let organizationTypeValue = organizationType ? organizationType.value : readonlyOrganizationType.innerText.toLowerCase();
        if (selectedText !== "Non-Federal Agency") {
            if (organizationTypeValue !== "federal") {
                if (organizationType){
                    organizationType.value = "federal";
                }else {
                    readonlyOrganizationType.innerText = "Federal"
                }
            }
        }else {
            if (organizationTypeValue === "federal") {
                if (organizationType){
                    organizationType.value =  "";
                }else {
                    readonlyOrganizationType.innerText =  "-"
                }
            }
        }

        handleOrganizationTypeChange(organizationType, organizationNameContainer, federalType);

        // Determine if any changes are necessary to the display of portfolio type or federal type
        // based on changes to the Federal Agency
        let federalPortfolioApi = document.getElementById("federal_and_portfolio_types_from_agency_json_url").value;
        fetch(`${federalPortfolioApi}?&agency_name=${selectedText}`)
        .then(response => {
            const statusCode = response.status;
            return response.json().then(data => ({ statusCode, data }));
        })
        .then(({ statusCode, data }) => {
            if (data.error) {
                console.error("Error in AJAX call: " + data.error);
                return;
            }
            updateReadOnly(data.federal_type, '.field-federal_type');
        })
        .catch(error => console.error("Error fetching federal and portfolio types: ", error));

        // Hide the contactList initially. 
        // If we can update the contact information, it'll be shown again.
        hideElement(contactList.parentElement);
        
        let seniorOfficialAddUrl = document.getElementById("senior-official-add-url").value;
        let $seniorOfficial = django.jQuery("#id_senior_official");
        let readonlySeniorOfficial = document.querySelector(".field-senior_official .readonly");
        let seniorOfficialApi = document.getElementById("senior_official_from_agency_json_url").value;
        fetch(`${seniorOfficialApi}?agency_name=${selectedText}`)
        .then(response => {
            const statusCode = response.status;
            return response.json().then(data => ({ statusCode, data }));
        })
        .then(({ statusCode, data }) => {
            if (data.error) {
                // Clear the field if the SO doesn't exist.
                if (statusCode === 404) {
                    if ($seniorOfficial && $seniorOfficial.length > 0) {
                        $seniorOfficial.val("").trigger("change");
                    }else {
                        // Show the "create one now" text if this field is none in readonly mode.
                        readonlySeniorOfficial.innerHTML = `<a href="${seniorOfficialAddUrl}">No senior official found. Create one now.</a>`;
                    }
                    console.warn("Record not found: " + data.error);
                }else {
                    console.error("Error in AJAX call: " + data.error);
                }
                return;
            }

            // Update the "contact details" blurb beneath senior official
            updateContactInfo(data);
            showElement(contactList.parentElement);
            
            // Get the associated senior official with this federal agency
            let seniorOfficialId = data.id;
            let seniorOfficialName = [data.first_name, data.last_name].join(" ");
            if ($seniorOfficial && $seniorOfficial.length > 0) {
                // If the senior official is a dropdown field, edit that
                updateSeniorOfficialDropdown($seniorOfficial, seniorOfficialId, seniorOfficialName);
            }else {
                if (readonlySeniorOfficial) {
                    let seniorOfficialLink = `<a href=/admin/registrar/seniorofficial/${seniorOfficialId}/change/>${seniorOfficialName}</a>`
                    readonlySeniorOfficial.innerHTML = seniorOfficialName ? seniorOfficialLink : "-";
                }
            }
        })
        .catch(error => console.error("Error fetching senior official: ", error));

    }

    function updateSeniorOfficialDropdown(dropdown, seniorOfficialId, seniorOfficialName) {
        if (!seniorOfficialId || !seniorOfficialName || !seniorOfficialName.trim()){
            // Clear the field if the SO doesn't exist
            dropdown.val("").trigger("change");
            return;
        }

        // Add the senior official to the dropdown.
        // This format supports select2 - if we decide to convert this field in the future.
        if (dropdown.find(`option[value='${seniorOfficialId}']`).length) {
            // Select the value that is associated with the current Senior Official.
            dropdown.val(seniorOfficialId).trigger("change");
        } else { 
            // Create a DOM Option that matches the desired Senior Official. Then append it and select it.
            let userOption = new Option(seniorOfficialName, seniorOfficialId, true, true);
            dropdown.append(userOption).trigger("change");
        }
    }

    function handleStateTerritoryChange(stateTerritory, urbanizationField) {
        let selectedValue = stateTerritory.value;
        if (selectedValue === "PR") {
            showElement(urbanizationField)
        } else {
            hideElement(urbanizationField)
        }
    }

    /**
     * Utility that selects a div from the DOM using selectorString,
     * and updates a div within that div which has class of 'readonly'
     * so that the text of the div is updated to updateText
     * @param {*} updateText 
     * @param {*} selectorString 
     */
    function updateReadOnly(updateText, selectorString) {
        // find the div by selectorString
        const selectedDiv = document.querySelector(selectorString);
        if (selectedDiv) {
            // find the nested div with class 'readonly' inside the selectorString div
            const readonlyDiv = selectedDiv.querySelector('.readonly');
            if (readonlyDiv) {
                // Update the text content of the readonly div
                readonlyDiv.textContent = updateText !== null ? updateText : '-';
            }
        }
    }

    function updateContactInfo(data) {
        if (!contactList) return;
    
        const titleSpan = contactList.querySelector(".contact_info_title");
        const emailSpan = contactList.querySelector(".contact_info_email");
        const phoneSpan = contactList.querySelector(".contact_info_phone");
    
        if (titleSpan) { 
            titleSpan.textContent = data.title || "None";
        };

        // Update the email field and the content for the clipboard
        if (emailSpan) {
            let copyButton = contactList.querySelector(".admin-icon-group");
            emailSpan.textContent = data.email || "None";
            if (data.email) {
                const clipboardInput = contactList.querySelector(".admin-icon-group input");
                if (clipboardInput) {
                    clipboardInput.value = data.email;
                };
                showElement(copyButton);
            }else {
                hideElement(copyButton);
            }
        }

        if (phoneSpan) {
            phoneSpan.textContent = data.phone || "None";
        };
    }
})();


/** An IIFE for dynamic DomainRequest fields
*/
(function dynamicDomainRequestFields(){
    const domainRequestPage = document.getElementById("domainrequest_form");
    if (domainRequestPage) {
        handlePortfolioSelection();
    }
})();


/** An IIFE for dynamic DomainInformation fields
*/
(function dynamicDomainInformationFields(){
    const domainInformationPage = document.getElementById("domaininformation_form");
    // DomainInformation is embedded inside domain so this should fire there too
    const domainPage = document.getElementById("domain_form");
    if (domainInformationPage) {
        handleSuborganizationFields();
    }

    if (domainPage) {
        handleSuborganizationFields(portfolioDropdownSelector="#id_domain_info-0-portfolio", suborgDropdownSelector="#id_domain_info-0-sub_organization");
    }
})();
