var EquipmentAppService = (function() {
    
    function submitApplication(user, payload) {
        // Validation
        if (!payload.items || !payload.returnDate || !payload.reason) {
            throw new Error("Missing required fields (items, returnDate, reason)");
        }

        var items = payload.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                throw new Error("Invalid items JSON");
            }
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Items list is empty");
        }

        // Create Application Data
        var appData = {
            studentId: user.studentId,
            name: user.name, // Assuming user object has name, or fetch from repo if payload doesn't have it. best to use User info from token.
            reason: payload.reason,
            items: items,
            summary: payload.summary || _generateSummary(items),
            pickupDate: payload.pickupDate,
            returnDate: payload.returnDate
        };

        var appId = EquipmentAppRepository.create(appData);
        
        return {
            applicationId: appId,
            status: "Submitted"
        };
    }

    function _generateSummary(items) {
        return items.map(function(i) {
            return (i.name || i.code) + " x" + (i.qty || 1);
        }).join(", ");
    }

    function getUserApplications(studentId) {
        return EquipmentAppRepository.findByStudentId(studentId);
    }

    return {
        submitApplication: submitApplication,
        getUserApplications: getUserApplications
    };

})();
