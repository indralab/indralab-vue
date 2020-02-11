const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};


const piecemeal_mixin = {
    props: {
        autoload: {
            type: Boolean,
            default: false
        }
    },
    data: function() {
        return {
            end_n: 0,
            dn: 10,
            bottom: false
        }
    },
    created: function() {
        if (!this.autoload) {
            this.end_n = 10;
            return;
        }
        window.console.log("Adding event listener to scroll.");
        window.addEventListener('scroll', this.updateBottom);

        this.loadMore();
    },
    destroyed: function() {
        window.console.log("Removing event listener to scroll.");
        window.removeEventListener('scroll', this.updateBottom)
    },
    computed: {
        list_shown: function() {
            if (!this.base_list)
                return;
            return this.base_list.slice(0, this.end_n);
        },
        next_batch: function() {
            return Math.min(this.base_list.length - this.end_n, this.dn);
        },
        show_buttons: function() {
            return this.next_batch > 0;
        }
    },
    methods: {
        loadMore: async function() {
            // If the list is currently not defined, just return.
            if (this.base_list == null)
                return;

            // If the list is fully loaded, there is nothing to do.
            if (this.end_n >= this.base_list.length) {
                return;
            }

            // Lengthen the list.
            this.end_n += this.dn;

            // If we're autoloading, check to see if we need to fill
            // in the page some more.
            if (this.autoload) {
                await sleep(100);
                if (this.bottomVisible()) {
                    this.loadMore();
                }
            }
        },

        loadAll: function() {
            this.end_n = this.base_list.length;
        },

        bottomVisible: function() {
            const scrollY = window.scrollY;
            const visible = document.documentElement.clientHeight;
            const pageHeight = document.documentElement.scrollHeight;
            const bottomOfPage = visible + scrollY + 5 >= pageHeight;
            return bottomOfPage || pageHeight < visible;
        },

        updateBottom: function() {
            this.bottom = this.bottomVisible();
        }
    },
    watch: {
        bottom: function(bottom) {
            if (bottom) {
                this.loadMore();
            }
        },

        base_list: function() {
            if (this.autoload)
                this.end_n = 10;
            else
                this.end_n = 0;
            this.bottom = false;

            this.loadMore();
        }
    }
};

export default piecemeal_mixin;
